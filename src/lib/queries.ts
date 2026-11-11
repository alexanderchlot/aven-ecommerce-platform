import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  isNotNull,
  lt,
  ne,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { PRICE_RANGES, type PriceRange, type Sort } from "@/lib/listing";

// The storefront's only data-access module. Every read is cached and tagged
// "products" so a future admin/order flow can call revalidateTag("products").

export type Product = {
  id: number;
  slug: string;
  name: string;
  category: string;
  categoryId: number;
  categorySlug: string;
  /** Price in öre (1 SEK = 100 öre). Format with formatPrice(). */
  price: number;
  image: string;
  alt: string;
  tag: string | null;
  /** Units available. 0 means sold out. */
  stock: number;
  description: string;
  details: string[];
};

export type Collection = {
  slug: string;
  title: string;
  image: string;
  alt: string;
};

const productColumns = {
  id: products.id,
  slug: products.slug,
  name: products.name,
  category: categories.name,
  categoryId: products.categoryId,
  categorySlug: categories.slug,
  price: products.priceOre,
  image: products.imageUrl,
  alt: products.imageAlt,
  tag: products.tag,
  stock: products.stockQuantity,
  description: products.description,
  details: products.details,
};

export async function getProducts(limit: number): Promise<Product[]> {
  "use cache";
  cacheTag("products");
  cacheLife("minutes");

  return db
    .select(productColumns)
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .orderBy(asc(products.id))
    .limit(limit);
}

/** Newest products first (by creation time, then id). */
export async function getLatestProducts(limit: number): Promise<Product[]> {
  "use cache";
  cacheTag("products");
  cacheLife("minutes");

  return db
    .select(productColumns)
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .orderBy(desc(products.createdAt), desc(products.id))
    .limit(limit);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  "use cache";
  cacheTag("products");
  cacheLife("minutes");

  const [row] = await db
    .select(productColumns)
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.slug, slug))
    .limit(1);
  return row ?? null;
}

/** Same category first, then everything else; never includes the product itself. */
export async function getRelatedProducts(
  productId: number,
  categoryId: number,
  limit = 4,
): Promise<Product[]> {
  "use cache";
  cacheTag("products");
  cacheLife("minutes");

  return db
    .select(productColumns)
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(ne(products.id, productId))
    .orderBy(desc(sql`${products.categoryId} = ${categoryId}`), asc(products.id))
    .limit(limit);
}

export async function getProductSlugs(): Promise<{ slug: string }[]> {
  "use cache";
  cacheTag("products");
  cacheLife("minutes");

  return db.select({ slug: products.slug }).from(products);
}

/** Categories that have an image are shown as homepage collection tiles. */
export async function getHomeCategories(limit = 4): Promise<Collection[]> {
  "use cache";
  cacheTag("products");
  cacheLife("minutes");

  const rows = await db
    .select({
      slug: categories.slug,
      title: categories.name,
      image: categories.imageUrl,
      alt: categories.imageAlt,
    })
    .from(categories)
    .where(isNotNull(categories.imageUrl))
    .orderBy(asc(categories.sortOrder))
    .limit(limit);

  return rows.map((r) => ({ ...r, image: r.image!, alt: r.alt ?? r.title }));
}

export type Category = { id: number; slug: string; name: string };

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  "use cache";
  cacheTag("products");
  cacheLife("minutes");

  const [row] = await db
    .select({ id: categories.id, slug: categories.slug, name: categories.name })
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);
  return row ?? null;
}

export async function getCategorySlugs(): Promise<{ slug: string }[]> {
  "use cache";
  cacheTag("products");
  cacheLife("minutes");

  return db.select({ slug: categories.slug }).from(categories);
}

export async function getProductsByCategory(
  categoryId: number,
  limit = 48,
): Promise<Product[]> {
  "use cache";
  cacheTag("products");
  cacheLife("minutes");

  return db
    .select(productColumns)
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.categoryId, categoryId))
    .orderBy(desc(products.createdAt), desc(products.id))
    .limit(limit);
}

/**
 * Case-insensitive match on name or description. Deliberately not cached:
 * the cache key would be arbitrary user input. LIKE wildcards in the query
 * are escaped so they match literally.
 */
export async function searchProducts(
  query: string,
  limit = 48,
): Promise<Product[]> {
  const pattern = `%${query.replace(/[\\%_]/g, "\\$&")}%`;

  return db
    .select(productColumns)
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(
      or(ilike(products.name, pattern), ilike(products.description, pattern)),
    )
    .orderBy(desc(products.createdAt), desc(products.id))
    .limit(limit);
}

/** Filtered + sorted products. Arguments are allow-listed, so caching is safe. */
export async function getListingProducts(
  categoryId: number | null,
  sort: Sort,
  price: PriceRange | null,
  inStock: boolean,
  limit = 48,
): Promise<Product[]> {
  "use cache";
  cacheTag("products");
  cacheLife("minutes");

  const range = PRICE_RANGES.find((r) => r.value === price);
  const conditions: (SQL | undefined)[] = [
    categoryId !== null ? eq(products.categoryId, categoryId) : undefined,
    inStock ? gte(products.stockQuantity, 1) : undefined,
    range?.min != null ? gte(products.priceOre, range.min) : undefined,
    range?.max != null ? lt(products.priceOre, range.max) : undefined,
  ];

  const order =
    sort === "price-asc"
      ? [asc(products.priceOre), asc(products.id)]
      : sort === "price-desc"
        ? [desc(products.priceOre), desc(products.id)]
        : [desc(products.createdAt), desc(products.id)];

  return db
    .select(productColumns)
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(...order)
    .limit(limit);
}

/** All categories in display order (for category filters). */
export async function getCategories(): Promise<Category[]> {
  "use cache";
  cacheTag("products");
  cacheLife("minutes");

  return db
    .select({ id: categories.id, slug: categories.slug, name: categories.name })
    .from(categories)
    .orderBy(asc(categories.sortOrder));
}
