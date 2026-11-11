import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductListing } from "@/components/product-listing";
import { parseListingState } from "@/lib/listing";
import {
  getCategoryBySlug,
  getCategorySlugs,
  getListingProducts,
} from "@/lib/queries";

export async function generateStaticParams() {
  return getCategorySlugs();
}

export async function generateMetadata({
  params,
}: PageProps<"/collections/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};
  return {
    title: `${category.name} | AVEN`,
    description: `Shop ${category.name.toLowerCase()} at AVEN.`,
  };
}

export default function CollectionPage({
  params,
  searchParams,
}: PageProps<"/collections/[slug]">) {
  // `params` and `searchParams` are request-time data, so they are read inside
  // a Suspense boundary to keep navigations into this route instant.
  return (
    <Suspense fallback={<div className="min-h-[70svh]" aria-hidden />}>
      <CollectionContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function CollectionContent({
  params,
  searchParams,
}: {
  params: PageProps<"/collections/[slug]">["params"];
  searchParams: PageProps<"/collections/[slug]">["searchParams"];
}) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const state = parseListingState(await searchParams);
  const products = await getListingProducts(
    category.id,
    state.sort,
    state.price,
    state.inStock,
  );

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
              {category.name}
            </li>
          </ol>
        </nav>
      </div>

      <section
        aria-labelledby="collection-title"
        className="container-page pb-section pt-8 lg:pt-12"
      >
        <header className="mb-8 lg:mb-12">
          <p className="eyebrow">Collection</p>
          <h1 id="collection-title" className="display mt-2">
            {category.name}
          </h1>
        </header>

        <ProductListing
          basePath={`/collections/${category.slug}`}
          state={{ ...state, category: null }}
          products={products}
          emptyTitle="Nothing here just yet"
          emptyText={`New ${category.name.toLowerCase()} pieces are on their way.`}
          emptyCta={{ href: "/collections/new", label: "See new arrivals" }}
        />
      </section>
    </>
  );
}
