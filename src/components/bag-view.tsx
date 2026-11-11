"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { useState } from "react";
import {
  FREE_SHIPPING_THRESHOLD_ORE,
  SHIPPING_FEE_ORE,
  formatPrice,
} from "@/lib/catalog";

export function BagView() {
  const { lines, ready, count, subtotal, setQuantity, remove } = useCart();
  const [pending, setPending] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Sends only ids and quantities; the server re-reads prices and stock from the
  // database, so nothing in localStorage is trusted.
  async function startCheckout() {
    setCheckoutError(null);
    setPending(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          items: lines.map((l) => ({ id: l.item.id, quantity: l.quantity })),
        }),
      });
      const data = (await res.json()) as {
        url?: string;
        error?: string;
        problems?: { message: string }[];
      };
      if (res.ok && data.url) {
        window.location.assign(data.url);
        return; // keep the button disabled while redirecting
      }
      setCheckoutError(
        data.problems?.map((p) => p.message).join(" ") ??
          data.error ??
          "We couldn't start checkout. Please try again.",
      );
    } catch {
      setCheckoutError("We couldn't start checkout. Please try again.");
    }
    setPending(false);
  }

  // Wait for localStorage so a saved bag doesn't flash as "empty".
  if (!ready) return <div className="min-h-[40svh]" aria-hidden />;

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center gap-6 border-y py-16 text-center">
        <p className="heading-2">Your bag is empty</p>
        <p className="max-w-md text-ink-soft">
          Discover our latest pieces and add your favourites to the bag.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/collections/new" className="btn btn-primary">
            Shop new arrivals
          </Link>
          <Link href="/" className="btn btn-secondary">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  const freeShipping = subtotal >= FREE_SHIPPING_THRESHOLD_ORE;

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_24rem] lg:gap-16">
      <ul className="border-t">
        {lines.map(({ item: p, quantity }, i) => (
          <li key={p.id} className="grid grid-cols-[6rem_1fr] gap-4 border-b py-6 sm:grid-cols-[8rem_1fr] sm:gap-6">
            <Link href={`/products/${p.slug}`} className="media-frame block">
              <Image
                src={p.image}
                alt={p.alt}
                fill
                priority={i === 0}
                sizes="(min-width: 40rem) 8rem, 6rem"
              />
            </Link>
            <div className="flex min-w-0 flex-col gap-3">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="eyebrow">{p.category}</p>
                  <Link
                    href={`/products/${p.slug}`}
                    className="heading-3 mt-1 block link-quiet"
                  >
                    {p.name}
                  </Link>
                  <p className="caption mt-1">{formatPrice(p.price)} each</p>
                </div>
                <p className="shrink-0">{formatPrice(p.price * quantity)}</p>
              </div>
              <div className="mt-auto flex flex-wrap items-center justify-between gap-4">
                <div
                  className="inline-flex items-center border"
                  role="group"
                  aria-label={`Quantity for ${p.name}`}
                >
                  <button
                    type="button"
                    className="size-11 disabled:opacity-40"
                    aria-label="Decrease quantity"
                    disabled={quantity <= 1}
                    onClick={() => setQuantity(p.id, quantity - 1)}
                  >
                    −
                  </button>
                  <span className="min-w-8 text-center" aria-live="polite">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    className="size-11 disabled:opacity-40"
                    aria-label="Increase quantity"
                    disabled={quantity >= p.stock}
                    onClick={() => setQuantity(p.id, quantity + 1)}
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  className="link-quiet caption underline underline-offset-4"
                  onClick={() => remove(p.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <aside
        aria-labelledby="summary-title"
        className="surface-stone h-fit p-6 lg:sticky lg:top-28 lg:p-8"
      >
        <h2 id="summary-title" className="heading-3">
          Order summary
        </h2>
        <dl className="mt-6 flex flex-col gap-3">
          <div className="flex justify-between gap-4">
            <dt className="text-ink-soft">
              Subtotal ({count} {count === 1 ? "item" : "items"})
            </dt>
            <dd>{formatPrice(subtotal)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-soft">Shipping</dt>
            <dd>{freeShipping ? "Free" : formatPrice(SHIPPING_FEE_ORE)}</dd>
          </div>
          <div className="mt-3 flex justify-between gap-4 border-t pt-4">
            <dt className="label">Total</dt>
            <dd className="heading-3">
              {formatPrice(subtotal + (freeShipping ? 0 : SHIPPING_FEE_ORE))}
            </dd>
          </div>
        </dl>
        <p className="caption mt-2">Prices include VAT.</p>
        {!freeShipping ? (
          <p className="caption mt-4">
            Add {formatPrice(FREE_SHIPPING_THRESHOLD_ORE - subtotal)} more for
            complimentary shipping.
          </p>
        ) : null}
        <button
          type="button"
          className="btn btn-primary btn-block mt-6"
          disabled={pending}
          onClick={startCheckout}
        >
          {pending ? "Please wait…" : "Checkout"}
        </button>
        <p className="caption mt-3 min-h-[1.5em] text-sale" role="alert">
          {checkoutError}
        </p>
        <p className="caption mt-1">
          Secure payment with Stripe (test mode: no real money is charged).
        </p>
        <Link href="/collections/new" className="btn btn-ghost btn-block mt-3">
          Continue shopping
        </Link>
      </aside>
    </div>
  );
}
