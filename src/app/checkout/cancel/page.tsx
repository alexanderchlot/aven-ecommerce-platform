import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Checkout cancelled | AVEN",
  robots: { index: false },
};

export default function CheckoutCancelPage() {
  return (
    <>
      <div className="container-page pt-5 lg:pt-8">
        <nav aria-label="Breadcrumb">
          <ol className="caption flex flex-wrap items-center gap-2">
            <li>
              <Link href="/bag" className="link-quiet">
                Shopping bag
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-ink">
              Checkout cancelled
            </li>
          </ol>
        </nav>
      </div>

      <section
        aria-labelledby="cancel-title"
        className="container-narrow pb-section pt-8 lg:pt-12"
      >
        <p className="eyebrow">No payment made</p>
        <h1 id="cancel-title" className="display mt-2">
          Checkout cancelled
        </h1>
        <p className="mt-4 max-w-md text-ink-soft">
          Nothing was charged and your bag is just as you left it.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/bag" className="btn btn-primary btn-block-mobile">
            Back to bag
          </Link>
          <Link href="/collections/new" className="btn btn-ghost">
            Continue shopping
          </Link>
        </div>
      </section>
    </>
  );
}
