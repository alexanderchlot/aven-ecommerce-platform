"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart, type CartItem } from "@/components/cart-provider";

export function AddToBag({ item }: { item: CartItem }) {
  const { lines, add } = useCart();
  const [added, setAdded] = useState(false);
  const soldOut = item.stock <= 0;
  const inBag = lines.find((l) => l.item.id === item.id)?.quantity ?? 0;
  const maxed = inBag >= item.stock;

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        className="btn btn-primary btn-block"
        disabled={soldOut || maxed}
        onClick={() => {
          add(item);
          setAdded(true);
        }}
      >
        {soldOut ? "Sold out" : maxed ? "Maximum in bag" : "Add to bag"}
      </button>
      <p className="caption min-h-[1.5em]" role="status">
        {added || maxed
          ? `${inBag} in your bag. `
          : ""}
        {added || maxed ? (
          <Link href="/bag" className="link-quiet underline underline-offset-4">
            View bag
          </Link>
        ) : null}
      </p>
    </div>
  );
}
