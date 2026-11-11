import type { Metadata } from "next";
import Link from "next/link";
import { BagView } from "@/components/bag-view";

export const metadata: Metadata = {
  title: "Shopping bag | AVEN",
};

export default function BagPage() {
  return (
    <>
      <div className="container-page pt-5 lg:pt-8">
        <nav aria-label="Breadcrumb">
          <ol className="caption flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="link-quiet">
                Home
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-ink">
              Shopping bag
            </li>
          </ol>
        </nav>
      </div>

      <section
        aria-labelledby="bag-title"
        className="container-page pb-section pt-8 lg:pt-12"
      >
        <header className="mb-8 lg:mb-12">
          <p className="eyebrow">Review</p>
          <h1 id="bag-title" className="display mt-2">
            Shopping bag
          </h1>
        </header>
        <BagView />
      </section>
    </>
  );
}
