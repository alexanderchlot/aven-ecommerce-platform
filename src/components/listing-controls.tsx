"use client";

import Link from "next/link";
import { useState } from "react";
import {
  PRICE_RANGES,
  SORTS,
  hasActiveFilters,
  listingHref,
  type ListingState,
} from "@/lib/listing";

type Props = {
  basePath: string;
  state: ListingState;
  /** Shown as a category filter on listings that span categories. */
  categories?: { slug: string; name: string }[];
  count: number;
};

const chip = (active: boolean) =>
  `btn btn-sm ${active ? "btn-primary" : "btn-secondary"}`;

// Sorting and filters are plain links, so the URL is the source of truth.
// On phones the controls sit behind a "Filter & sort" toggle.
export function ListingControls({ basePath, state, categories, count }: Props) {
  const [open, setOpen] = useState(false);
  const active = hasActiveFilters(state);
  const href = (patch: Partial<ListingState>) =>
    listingHref(basePath, { ...state, ...patch });

  return (
    <div className="mb-8 border-y py-4 lg:mb-10">
      <div className="flex items-center justify-between gap-4">
        <p className="caption" role="status">
          {count} {count === 1 ? "piece" : "pieces"}
        </p>
        <button
          type="button"
          className="label py-2 lg:hidden"
          aria-expanded={open}
          aria-controls="listing-controls"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "Hide filters" : "Filter & sort"}
          {active ? " •" : ""}
        </button>
      </div>

      <div
        id="listing-controls"
        className={`${open ? "flex" : "hidden"} mt-4 flex-col gap-6 lg:mt-4 lg:flex lg:flex-row lg:flex-wrap lg:items-start lg:gap-x-12 lg:gap-y-4`}
      >
        <fieldset className="flex flex-col gap-2">
          <legend className="eyebrow mb-2">Sort by</legend>
          <div className="flex flex-wrap gap-2">
            {SORTS.map((s) => (
              <Link
                key={s.value}
                href={href({ sort: s.value })}
                scroll={false}
                className={chip(state.sort === s.value)}
                aria-current={state.sort === s.value ? "true" : undefined}
              >
                {s.label}
              </Link>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="eyebrow mb-2">Price</legend>
          <div className="flex flex-wrap gap-2">
            {PRICE_RANGES.map((r) => {
              const on = state.price === r.value;
              return (
                <Link
                  key={r.value}
                  href={href({ price: on ? null : r.value })}
                  scroll={false}
                  className={chip(on)}
                  aria-current={on ? "true" : undefined}
                >
                  {r.label}
                </Link>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="eyebrow mb-2">Availability</legend>
          <div className="flex flex-wrap gap-2">
            <Link
              href={href({ inStock: !state.inStock })}
              scroll={false}
              className={chip(state.inStock)}
              aria-current={state.inStock ? "true" : undefined}
            >
              In stock only
            </Link>
          </div>
        </fieldset>

        {categories && categories.length > 0 ? (
          <fieldset className="flex flex-col gap-2">
            <legend className="eyebrow mb-2">Category</legend>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => {
                const on = state.category === c.slug;
                return (
                  <Link
                    key={c.slug}
                    href={href({ category: on ? null : c.slug })}
                    scroll={false}
                    className={chip(on)}
                    aria-current={on ? "true" : undefined}
                  >
                    {c.name}
                  </Link>
                );
              })}
            </div>
          </fieldset>
        ) : null}

        {active ? (
          <div className="lg:self-end">
            <Link
              href={listingHref(basePath, { sort: state.sort })}
              scroll={false}
              className="link-quiet caption underline underline-offset-4"
            >
              Clear filters
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
