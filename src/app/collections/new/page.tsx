import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ProductListing } from "@/components/product-listing";
import { parseListingState } from "@/lib/listing";
import { getCategories, getListingProducts } from "@/lib/queries";

export const metadata: Metadata = {
  title: "New arrivals | AVEN",
  description: "The latest pieces to join the AVEN collection.",
};

export default function NewArrivalsPage({
  searchParams,
}: PageProps<"/collections/new">) {
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
              New arrivals
            </li>
          </ol>
        </nav>
      </div>

      <section
        aria-labelledby="new-arrivals-title"
        className="container-page pb-section pt-8 lg:pt-12"
      >
        <header className="mb-8 flex flex-col gap-4 lg:mb-12 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow">Just landed</p>
            <h1 id="new-arrivals-title" className="display mt-2">
              New arrivals
            </h1>
          </div>
          <p className="max-w-md text-ink-soft lg:text-right">
            The latest pieces to join the collection.
          </p>
        </header>

        {/* `searchParams` is request-time data: read it inside Suspense. */}
        <Suspense fallback={<div className="min-h-[60svh]" aria-hidden />}>
          <NewArrivalsListing searchParams={searchParams} />
        </Suspense>
      </section>
    </>
  );
}

async function NewArrivalsListing({
  searchParams,
}: {
  searchParams: PageProps<"/collections/new">["searchParams"];
}) {
  const state = parseListingState(await searchParams);
  const categories = await getCategories();
  const category = categories.find((c) => c.slug === state.category);
  const products = await getListingProducts(
    category?.id ?? null,
    state.sort,
    state.price,
    state.inStock,
  );

  return (
    <ProductListing
      basePath="/collections/new"
      state={{ ...state, category: category?.slug ?? null }}
      products={products}
      categories={categories}
      emptyTitle="Nothing new just yet"
      emptyText="New pieces are on their way. Check back soon."
      emptyCta={{ href: "/", label: "Back to home" }}
    />
  );
}
