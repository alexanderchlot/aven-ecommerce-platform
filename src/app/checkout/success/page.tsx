import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { ClearCart } from "@/components/clear-cart";
import { formatPrice } from "@/lib/catalog";
import { getStripe } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "Order confirmed | AVEN",
  robots: { index: false },
};

export default function CheckoutSuccessPage({
  searchParams,
}: PageProps<"/checkout/success">) {
  return (
    <section
      aria-labelledby="success-title"
      className="container-narrow pb-section pt-12 lg:pt-20"
    >
      {/* `searchParams` is request-time data: read it inside Suspense. */}
      <Suspense fallback={<div className="min-h-[40svh]" aria-hidden />}>
        <SuccessContent searchParams={searchParams} />
      </Suspense>
    </section>
  );
}

async function SuccessContent({
  searchParams,
}: {
  searchParams: PageProps<"/checkout/success">["searchParams"];
}) {
  // The Stripe SDK reads the clock and makes a network call: always request-time.
  await connection();
  const { session_id } = await searchParams;
  const id = Array.isArray(session_id) ? session_id[0] : session_id;

  // Display only: orders and stock are recorded by the verified webhook.
  let session = null;
  if (id && /^cs_test_[A-Za-z0-9_]+$/.test(id)) {
    try {
      session = await getStripe().checkout.sessions.retrieve(id);
    } catch {
      session = null;
    }
  }

  if (!session) {
    return (
      <>
        <p className="eyebrow">Order</p>
        <h1 id="success-title" className="display mt-2">
          We couldn&apos;t find that order
        </h1>
        <p className="mt-4 max-w-md text-ink-soft">
          If you just paid, your payment is safe. Contact us with your payment details and we&apos;ll help.
        </p>
        <div className="mt-8">
          <Link href="/" className="btn btn-primary">
            Back to home
          </Link>
        </div>
      </>
    );
  }

  const paid = session.payment_status === "paid";
  const email = session.customer_details?.email;

  return (
    <>
      {paid ? <ClearCart /> : null}
      <p className="eyebrow">{paid ? "Thank you" : "Payment pending"}</p>
      <h1 id="success-title" className="display mt-2">
        {paid ? "Order confirmed" : "We're confirming your payment"}
      </h1>
      <p className="mt-4 max-w-md text-ink-soft">
        {paid
          ? `We've received your payment${email ? ` for ${email}` : ""}.`
          : "Your payment method confirms in the background. This can take a little while."}
      </p>
      {session.amount_total != null ? (
        <dl className="mt-8 max-w-md border-t">
          <div className="flex justify-between gap-4 border-b py-5">
            <dt className="label">Total paid</dt>
            <dd className="heading-3">{formatPrice(session.amount_total)}</dd>
          </div>
        </dl>
      ) : null}
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/collections/new" className="btn btn-primary btn-block-mobile">
          Continue shopping
        </Link>
        <Link href="/" className="btn btn-ghost">
          Back to home
        </Link>
      </div>
    </>
  );
}
