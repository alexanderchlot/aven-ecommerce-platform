import { randomBytes } from "node:crypto";
import { inArray } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db";
import { products } from "@/db/schema";
import { auth } from "@/lib/auth";
import { FREE_SHIPPING_THRESHOLD_ORE, SHIPPING_FEE_ORE } from "@/lib/catalog";
import { getAppUrl, getStripe } from "@/lib/stripe";

const MAX_LINES = 20;
const MAX_QUANTITY = 10;

const json = (body: unknown, status: number) => Response.json(body, { status });

// Creates a Stripe Checkout Session. The client sends only product ids and
// quantities: names, prices and stock are always read from the database here.
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  const raw = (body as { items?: unknown } | null)?.items;
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_LINES) {
    return json({ error: "Your bag is empty or invalid." }, 400);
  }

  // Validate and merge duplicate ids.
  const wanted = new Map<number, number>();
  for (const line of raw) {
    const id = (line as { id?: unknown })?.id;
    const qty = (line as { quantity?: unknown })?.quantity;
    if (
      !Number.isInteger(id) ||
      !Number.isInteger(qty) ||
      (qty as number) < 1 ||
      (qty as number) > MAX_QUANTITY
    ) {
      return json({ error: "Your bag is empty or invalid." }, 400);
    }
    wanted.set(id as number, (wanted.get(id as number) ?? 0) + (qty as number));
  }

  // Fresh read from Neon (deliberately not the cached queries).
  const rows = await db
    .select()
    .from(products)
    .where(inArray(products.id, [...wanted.keys()]));
  const byId = new Map(rows.map((p) => [p.id, p]));

  const problems: { id: number; message: string }[] = [];
  for (const [id, qty] of wanted) {
    const p = byId.get(id);
    if (!p) problems.push({ id, message: "This product is no longer available." });
    else if (p.stockQuantity <= 0)
      problems.push({ id, message: `${p.name} is sold out.` });
    else if (qty > p.stockQuantity)
      problems.push({
        id,
        message: `Only ${p.stockQuantity} of ${p.name} left in stock.`,
      });
  }
  if (problems.length > 0) {
    return json({ error: "Some items in your bag changed.", problems }, 409);
  }

  const lineItems = [...wanted].map(([id, qty]) => {
    const p = byId.get(id)!;
    return {
      quantity: qty,
      price_data: {
        currency: "sek",
        unit_amount: p.priceOre, // SEK minor unit = öre
        product_data: {
          name: p.name,
          images: [p.imageUrl],
          metadata: { product_id: String(p.id) },
        },
      },
    };
  });
  const subtotal = [...wanted].reduce(
    (n, [id, qty]) => n + byId.get(id)!.priceOre * qty,
    0,
  );
  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD_ORE ? 0 : SHIPPING_FEE_ORE;

  // Link the order to the account when the customer happens to be signed in.
  const session = await auth.api.getSession({ headers: await headers() });
  const appUrl = getAppUrl();
  const suffix = Array.from(randomBytes(8), (b) =>
    String.fromCharCode(97 + (b % 26)),
  ).join("");

  try {
    const checkout = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      shipping_address_collection: { allowed_countries: ["SE", "NO", "DK", "FI"] },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            display_name: shippingFee === 0 ? "Free shipping" : "Standard shipping",
            fixed_amount: { amount: shippingFee, currency: "sek" },
          },
        },
      ],
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout/cancel`,
      ...(session
        ? { client_reference_id: session.user.id, customer_email: session.user.email }
        : {}),
      integration_identifier: `aven-checkout-${suffix}`,
    });
    return json({ url: checkout.url }, 200);
  } catch (error) {
    console.error("Stripe checkout session failed:", (error as Error).message);
    return json({ error: "We couldn't start checkout. Please try again." }, 502);
  }
}
