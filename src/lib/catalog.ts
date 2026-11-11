// Static storefront helpers and content. Products, categories and stock
// live in the database (see src/lib/queries.ts).
// All images are Unsplash photos (https://unsplash.com/license).

export const unsplash = (id: string, width = 1600) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=80`;

/** Format an amount in öre as Swedish kronor, e.g. 890000 -> "8 900 kr". */
export const formatPrice = (ore: number) =>
  new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 0,
  }).format(ore / 100);

/** Orders above this amount ship free (2 500 kr). In öre. */
export const FREE_SHIPPING_THRESHOLD_ORE = 250000;

/** Flat shipping fee below the free-shipping threshold (2 500 kr). In öre. */
export const SHIPPING_FEE_ORE = 5900;

export const images = {
  heroPrimary: unsplash("1483985988355-763728e1935b"),
  heroSecondary: unsplash("1539109136881-3be0616acf4b"),
  editorialRack: unsplash("1490481651871-ab68de25d43d"),
  spotlight: unsplash("1552374196-1ab2a1c593e8"),
};

export const navLinks = [
  { label: "New in", href: "/collections/new" },
  { label: "Women", href: "/collections/women" },
  { label: "Men", href: "/collections/men" },
  { label: "Bags", href: "/collections/bags" },
  { label: "Shoes", href: "/collections/shoes" },
  { label: "Gifts", href: "/collections/gifts" },
];

export type StockStatus = {
  state: "in" | "low" | "out";
  label: string;
};

export const stockStatus = (product: { stock: number }): StockStatus => {
  if (product.stock <= 0) return { state: "out", label: "Sold out" };
  if (product.stock <= 5)
    return { state: "low", label: `Only ${product.stock} left` };
  return { state: "in", label: "In stock" };
};
