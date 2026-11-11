import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AddToBag } from "@/components/add-to-bag";
import { ProductCard } from "@/components/product-card";
import {
  FREE_SHIPPING_THRESHOLD_ORE,
  formatPrice,
  stockStatus,
} from "@/lib/catalog";
import {
  getProductBySlug,
  getProductSlugs,
  getRelatedProducts,
} from "@/lib/queries";

export async function generateStaticParams() {
  return getProductSlugs();
}

export async function generateMetadata({
  params,
}: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return {
    title: `${product.name} | AVEN`,
    description: product.description,
  };
}

export default function ProductPage({
  params,
}: PageProps<"/products/[slug]">) {
  // `params` is request-time data, so it is read inside a Suspense boundary
  // to keep navigations into this route instant.
  return (
    <Suspense fallback={<div className="min-h-[70svh]" aria-hidden />}>
      <ProductContent params={params} />
    </Suspense>
  );
}

async function ProductContent({
  params,
}: {
  params: PageProps<"/products/[slug]">["params"];
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const stock = stockStatus(product);
  const related = await getRelatedProducts(product.id, product.categoryId);
  const largeImage = product.image.replace("w=800", "w=1600");

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
            <li>
              <Link
                href={`/collections/${product.categorySlug}`}
                className="link-quiet"
              >
                {product.category}
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-ink">
              {product.name}
            </li>
          </ol>
        </nav>
      </div>

      <section
        aria-labelledby="product-title"
        className="container-page grid gap-8 py-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-16 lg:py-10"
      >
        {/* Imagery: full-bleed on phones, large on desktop */}
        <div className="-mx-gutter lg:mx-0">
          <div className="media-frame">
            <Image
              src={largeImage}
              alt={product.alt}
              fill
              priority
              sizes="(min-width: 64rem) 55vw, 100vw"
            />
            {product.stock <= 0 || product.tag ? (
              <span className="label absolute left-4 top-4 bg-paper px-2 py-1">
                {product.stock <= 0 ? "Sold out" : product.tag}
              </span>
            ) : null}
          </div>
        </div>

        {/* Product information: sticky beside the image on desktop */}
        <div className="flex flex-col gap-6 lg:sticky lg:top-[calc(var(--header-height)+1.5rem)] lg:self-start">
          <div>
            <Link
              href={`/collections/${product.categorySlug}`}
              className="eyebrow link-quiet"
            >
              {product.category}
            </Link>
            <h1 id="product-title" className="heading-1 mt-2">
              {product.name}
            </h1>
            <p className="mt-4 text-lg">{formatPrice(product.price)}</p>
          </div>

          <p
            className="label flex items-center gap-2"
            data-stock={stock.state}
          >
            <span
              aria-hidden
              className={`inline-block size-2 rounded-full ${
                stock.state === "in" ? "bg-accent" : "bg-sale"
              }`}
            />
            {stock.label}
          </p>

          <p className="max-w-prose text-ink-soft">{product.description}</p>

          <AddToBag
            item={{
              id: product.id,
              slug: product.slug,
              name: product.name,
              category: product.category,
              price: product.price,
              image: product.image,
              alt: product.alt,
              stock: product.stock,
            }}
          />

          <div className="border-t">
            <details className="group border-b" open>
              <summary className="label flex cursor-pointer list-none items-center justify-between py-4">
                Details
                <span aria-hidden className="transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <ul className="caption flex flex-col gap-2 pb-4">
                {product.details.map((d) => (
                  <li key={d}>{d}</li>
                ))}
                <li>Category: {product.category}</li>
              </ul>
            </details>
            <details className="group border-b">
              <summary className="label flex cursor-pointer list-none items-center justify-between py-4">
                Shipping &amp; returns
                <span aria-hidden className="transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="caption pb-4">
                Complimentary shipping on orders over{" "}
                {formatPrice(FREE_SHIPPING_THRESHOLD_ORE)}. Free returns within
                thirty days of delivery.
              </p>
            </details>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="related-title">
        <div className="container-page">
          <div className="mb-8 flex items-end justify-between gap-6">
            <div>
              <p className="eyebrow">You may also like</p>
              <h2 id="related-title" className="heading-1 mt-2">
                Complete the look
              </h2>
            </div>
            <Link href="/" className="btn btn-ghost">
              Back to home
            </Link>
          </div>
          <div className="grid-products">
            {related.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
