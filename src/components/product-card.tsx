import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/catalog";
import type { Product } from "@/lib/queries";

export function ProductCard({
  product,
  priority = false,
}: {
  product: Product;
  priority?: boolean;
}) {
  return (
    <Link href={`/products/${product.slug}`} className="product-card">
      <div className="media-frame">
        <Image
          src={product.image}
          alt={product.alt}
          fill
          priority={priority}
          sizes="(min-width: 80rem) 24vw, (min-width: 48rem) 24vw, 48vw"
        />
        {product.stock <= 0 || product.tag ? (
          <span className="label absolute left-3 top-3 bg-paper px-2 py-1">
            {product.stock <= 0 ? "Sold out" : product.tag}
          </span>
        ) : null}
      </div>
      <div className="flex flex-col gap-1 px-1">
        <span className="eyebrow">{product.category}</span>
        <span className="product-card__name">{product.name}</span>
        <span className="product-card__price">{formatPrice(product.price)}</span>
      </div>
    </Link>
  );
}
