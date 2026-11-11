import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ProductCard } from "@/components/product-card";
import { searchProducts } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Search | AVEN",
  description: "Search the AVEN collection.",
};

const MAX_QUERY_LENGTH = 100;

export default function SearchPage({ searchParams }: PageProps<"/search">) {
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
              Search
            </li>
          </ol>
        </nav>
      </div>

      <section
        aria-labelledby="search-title"
        className="container-page pb-section pt-8 lg:pt-12"
      >
        {/* `searchParams` is request-time data: read it inside Suspense. */}
        <Suspense fallback={<div className="min-h-[60svh]" aria-hidden />}>
          <SearchContent searchParams={searchParams} />
        </Suspense>
      </section>
    </>
  );
}

async function SearchContent({
  searchParams,
}: {
  searchParams: PageProps<"/search">["searchParams"];
}) {
  const { q } = await searchParams;
  const raw = Array.isArray(q) ? q[0] : q;
  const query = (raw ?? "").trim().slice(0, MAX_QUERY_LENGTH);
  const results = query ? await searchProducts(query) : null;

  return (
    <>
      <header className="mb-8 lg:mb-12">
        <p className="eyebrow">Find your piece</p>
        <h1 id="search-title" className="display mt-2">
          Search
        </h1>
        {/* Plain GET form: Enter submits it, and it works without JavaScript. */}
        <form
          action="/search"
          role="search"
          className="mt-8 flex max-w-2xl flex-col gap-4 sm:flex-row sm:items-end"
        >
          <label className="flex-1">
            <span className="sr-only">Search products</span>
            <input
              type="search"
              name="q"
              defaultValue={query}
              maxLength={MAX_QUERY_LENGTH}
              autoComplete="off"
              placeholder="Search coats, bags, shoes…"
              className="field"
            />
          </label>
          <button type="submit" className="btn btn-primary btn-block-mobile">
            Search
          </button>
        </form>
      </header>

      {results === null ? (
        <p className="text-ink-soft" role="status">
          Type a product name or a word from its description.
        </p>
      ) : results.length > 0 ? (
        <>
          <p className="caption mb-6" role="status">
            {results.length} {results.length === 1 ? "result" : "results"} for
            &ldquo;{query}&rdquo;
          </p>
          <div className="grid-products">
            {results.map((p, i) => (
              <ProductCard key={p.slug} product={p} priority={i < 4} />
            ))}
          </div>
        </>
      ) : (
        <div
          className="flex flex-col items-center gap-6 border-y py-16 text-center"
          role="status"
        >
          <p className="heading-2">No results for &ldquo;{query}&rdquo;</p>
          <p className="max-w-md text-ink-soft">
            Check the spelling, try a more general word such as &ldquo;coat&rdquo;
            or &ldquo;bag&rdquo;, or browse what&apos;s new.
          </p>
          <Link href="/collections/new" className="btn btn-primary">
            See new arrivals
          </Link>
        </div>
      )}
    </>
  );
}
