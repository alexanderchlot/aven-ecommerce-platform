import Link from "next/link";
import { ListingControls } from "@/components/listing-controls";
import { ProductCard } from "@/components/product-card";
import {
  hasActiveFilters,
  listingHref,
  type ListingState,
} from "@/lib/listing";
import type { Product } from "@/lib/queries";

// Controls + grid + empty states shared by the collection pages.
export function ProductListing({
  basePath,
  state,
  products,
  categories,
  emptyTitle,
  emptyText,
  emptyCta,
}: {
  basePath: string;
  state: ListingState;
  products: Product[];
  categories?: { slug: string; name: string }[];
  emptyTitle: string;
  emptyText: string;
  emptyCta: { href: string; label: string };
}) {
  const filtered = hasActiveFilters(state);

  return (
    <>
      <ListingControls
        basePath={basePath}
        state={state}
        categories={categories}
        count={products.length}
      />
      {products.length > 0 ? (
        <div className="grid-products">
          {products.map((p, i) => (
            <ProductCard key={p.slug} product={p} priority={i < 4} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6 border-b py-16 text-center">
          <p className="heading-2">
            {filtered ? "No pieces match your filters" : emptyTitle}
          </p>
          <p className="max-w-md text-ink-soft">
            {filtered
              ? "Try removing a filter or widening the price range to see more."
              : emptyText}
          </p>
          {filtered ? (
            <Link
              href={listingHref(basePath, { sort: state.sort })}
              className="btn btn-primary"
            >
              Clear filters
            </Link>
          ) : (
            <Link href={emptyCta.href} className="btn btn-primary">
              {emptyCta.label}
            </Link>
          )}
        </div>
      )}
    </>
  );
}
