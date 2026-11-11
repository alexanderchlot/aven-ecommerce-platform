// URL-driven sorting and filtering for product listing pages. Everything is
// parsed against fixed allow-lists so the (cached) queries only ever see a
// small, bounded set of values.

export const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
] as const;
export type Sort = (typeof SORTS)[number]["value"];

/** Bounds in öre; min inclusive, max exclusive. */
export const PRICE_RANGES = [
  { value: "under-5000", label: "Under 5 000 kr", min: null, max: 500000 },
  { value: "5000-10000", label: "5 000 – 10 000 kr", min: 500000, max: 1000000 },
  { value: "over-10000", label: "Over 10 000 kr", min: 1000000, max: null },
] as const;
export type PriceRange = (typeof PRICE_RANGES)[number]["value"];

export type ListingState = {
  sort: Sort;
  price: PriceRange | null;
  inStock: boolean;
  /** Category slug; only used on listings that span categories. */
  category: string | null;
};

type RawParams = { [key: string]: string | string[] | undefined };

const first = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;

export function parseListingState(params: RawParams): ListingState {
  const sort = first(params.sort);
  const price = first(params.price);
  const category = first(params.category);
  return {
    sort: SORTS.find((s) => s.value === sort)?.value ?? "newest",
    price: PRICE_RANGES.find((p) => p.value === price)?.value ?? null,
    inStock: first(params.stock) === "in",
    category: category && category.length <= 60 ? category : null,
  };
}

export const hasActiveFilters = (s: ListingState) =>
  s.price !== null || s.inStock || s.category !== null;

/** Build a listing URL; defaults are omitted to keep URLs clean. */
export function listingHref(basePath: string, state: Partial<ListingState>) {
  const qs = new URLSearchParams();
  if (state.sort && state.sort !== "newest") qs.set("sort", state.sort);
  if (state.price) qs.set("price", state.price);
  if (state.inStock) qs.set("stock", "in");
  if (state.category) qs.set("category", state.category);
  const s = qs.toString();
  return s ? `${basePath}?${s}` : basePath;
}
