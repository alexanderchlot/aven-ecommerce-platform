import { eq, sql } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import type Stripe from "stripe";
import { db } from "@/db";
import { user } from "@/db/schema";
import { getStripe } from "@/lib/stripe";

// Stripe calls this endpoint after a payment. Orders are recorded and stock is
// reduced ONLY here, after the signature is verified (never from the success page).

const pgCode = (error: unknown): string | undefined => {
  const e = error as { code?: string; cause?: { code?: string } } | null;
  return e?.cause?.code ?? e?.code;
};

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return new Response("Webhook not configured", { status: 500 });
  }
  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  // The signature covers the exact raw body, so read it as text (not JSON).
  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = await getStripe().webhooks.constructEventAsync(
      payload,
      signature,
      secret,
    );
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        await fulfill(event.data.object.id);
        break;
      case "checkout.session.async_payment_failed":
        console.warn("Async payment failed for session", event.data.object.id);
        break;
      default:
        break; // other events are acknowledged and ignored
    }
  } catch (error) {
    console.error("Webhook handling failed:", (error as Error).message);
    return new Response("Handler error", { status: 500 }); // Stripe will retry
  }

  return new Response(null, { status: 200 });
}

type OrderItem = {
  product_id: number;
  name: string;
  unit_price_ore: number;
  quantity: number;
};

async function fulfill(sessionId: string) {
  const session = await getStripe().checkout.sessions.retrieve(sessionId, {
    expand: ["line_items.data.price.product"],
  });
  // Delayed payment methods complete while still unpaid: wait for async_payment_succeeded.
  if (session.payment_status !== "paid") return;

  const items: OrderItem[] = (session.line_items?.data ?? []).flatMap((li) => {
    const product = li.price?.product;
    if (!product || typeof product === "string" || "deleted" in product) return [];
    const productId = Number(product.metadata?.product_id);
    if (!Number.isInteger(productId) || !li.quantity) return [];
    return [
      {
        product_id: productId,
        name: li.description ?? product.name,
        unit_price_ore: li.price?.unit_amount ?? 0,
        quantity: li.quantity,
      },
    ];
  });
  if (items.length === 0) {
    console.error("Paid session without recognisable items:", session.id);
    return;
  }

  // Only link a user id that really exists.
  let userId: string | null = null;
  if (session.client_reference_id) {
    const [u] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.id, session.client_reference_id))
      .limit(1);
    userId = u?.id ?? null;
  }

  const shipping = session.collected_information?.shipping_details;
  const order = {
    id: crypto.randomUUID(),
    sessionId: session.id,
    paymentIntent:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : (session.payment_intent?.id ?? null),
    email: session.customer_details?.email ?? session.customer_email ?? null,
    userId,
    amountTotal: session.amount_total ?? 0,
    currency: session.currency ?? "sek",
    shippingName: shipping?.name ?? null,
    shippingAddress: shipping?.address ? JSON.stringify(shipping.address) : null,
    items: JSON.stringify(items),
  };

  try {
    const outcome = await recordOrder(order, false);
    if (outcome === "paid") revalidateTag("products", { expire: 0 });
  } catch (error) {
    // 22012 = our all-or-nothing assertion fired, 23514 = stock CHECK constraint.
    // Both mean stock ran out between checkout and payment, and the statement
    // (order, items and stock changes) was rolled back as a whole.
    const code = pgCode(error);
    if (code !== "22012" && code !== "23514") throw error;
    await recordOrder(order, true);
    console.error("Order needs review (insufficient stock):", session.id);
  }
}

/**
 * Records one order, its items and the stock decrements in a SINGLE SQL
 * statement, so it is atomic:
 *  - Duplicates: `ON CONFLICT (stripe_session_id) DO NOTHING`. If Stripe
 *    redelivers an event, no order row is inserted, so no items are inserted and
 *    no stock is touched. Concurrent deliveries are serialised by the unique index.
 *  - Stock: each product is only decremented `WHERE stock_quantity >= quantity`,
 *    and only for a new order whose status is "paid". If any decrement would not
 *    succeed, the statement aborts with an error, rolling back everything
 *    (including the order row). The DB CHECK (stock_quantity >= 0) is a backstop.
 *  - `forceReview` records the order as "needs_review" without touching stock.
 * Returns the stored status, or "duplicate" when the session was already recorded.
 */
async function recordOrder(
  o: {
    id: string;
    sessionId: string;
    paymentIntent: string | null;
    email: string | null;
    userId: string | null;
    amountTotal: number;
    currency: string;
    shippingName: string | null;
    shippingAddress: string | null;
    items: string;
  },
  forceReview: boolean,
): Promise<"paid" | "needs_review" | "duplicate"> {
  const result = await db.execute(sql`
    WITH requested AS (
      SELECT * FROM jsonb_to_recordset(${o.items}::jsonb)
        AS x(product_id int, name text, unit_price_ore int, quantity int)
    ),
    enough AS (
      SELECT NOT EXISTS (
        SELECT 1 FROM requested r
        LEFT JOIN products p ON p.id = r.product_id
        WHERE p.id IS NULL OR p.stock_quantity < r.quantity
      ) AS ok
    ),
    -- Items whose product no longer exists can't be stored (foreign key); the
    -- order is then flagged "needs_review" by the check above.
    items AS (
      SELECT r.* FROM requested r
      WHERE EXISTS (SELECT 1 FROM products p WHERE p.id = r.product_id)
    ),
    new_order AS (
      INSERT INTO orders (
        id, stripe_session_id, payment_intent, email, user_id, status,
        amount_total_ore, currency, shipping_name, shipping_address
      )
      SELECT
        ${o.id}::text, ${o.sessionId}::text, ${o.paymentIntent}::text,
        ${o.email}::text, ${o.userId}::text,
        CASE WHEN ${forceReview}::boolean THEN 'needs_review'
             WHEN (SELECT ok FROM enough) THEN 'paid'
             ELSE 'needs_review' END,
        ${o.amountTotal}::int, ${o.currency}::text, ${o.shippingName}::text,
        ${o.shippingAddress}::jsonb
      ON CONFLICT (stripe_session_id) DO NOTHING
      RETURNING id, status
    ),
    new_items AS (
      INSERT INTO order_items (order_id, product_id, name, unit_price_ore, quantity)
      SELECT n.id, i.product_id, i.name, i.unit_price_ore, i.quantity
      FROM new_order n CROSS JOIN items i
      RETURNING 1
    ),
    decremented AS (
      UPDATE products p
      SET stock_quantity = p.stock_quantity - i.quantity, updated_at = now()
      FROM items i, new_order n
      WHERE p.id = i.product_id
        AND n.status = 'paid'
        AND p.stock_quantity >= i.quantity
      RETURNING p.id
    )
    SELECT
      (SELECT status FROM new_order) AS status,
      -- Division by zero (22012) aborts the whole statement, rolling back the
      -- order, items and stock changes, when a "paid" order could not decrement
      -- every product. The divisor is not a constant, so the planner can't
      -- evaluate it early.
      1 / (CASE
        WHEN (SELECT status FROM new_order) = 'paid'
         AND (SELECT count(*) FROM decremented) <> (SELECT count(*) FROM items)
        THEN 0 ELSE 1 END) AS assertion
  `);

  const status = (result.rows[0] as { status: string | null } | undefined)?.status;
  if (status === "paid" || status === "needs_review") return status;
  return "duplicate";
}
