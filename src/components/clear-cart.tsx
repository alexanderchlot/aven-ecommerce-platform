"use client";

import { useEffect } from "react";
import { useCart } from "@/components/cart-provider";

// Empties the bag after a confirmed payment (rendered on the success page).
export function ClearCart() {
  const { clear } = useCart();
  useEffect(() => {
    clear();
  }, [clear]);
  return null;
}
