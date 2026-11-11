"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { Product } from "@/lib/queries";

// Client-side cart persisted in localStorage. Each line keeps a snapshot of the
// product (price in öre, stock) taken when it was added.

export type CartItem = Pick<
  Product,
  "id" | "slug" | "name" | "category" | "price" | "image" | "alt" | "stock"
>;
export type CartLine = { item: CartItem; quantity: number };

type CartContextValue = {
  lines: CartLine[];
  /** False until localStorage has been read on the client. */
  ready: boolean;
  count: number;
  subtotal: number;
  add: (item: CartItem) => void;
  setQuantity: (id: number, quantity: number) => void;
  remove: (id: number) => void;
  clear: () => void;
};

const STORAGE_KEY = "atelier-cart-v1";
const CartContext = createContext<CartContextValue | null>(null);

const isInt = (n: unknown): n is number => Number.isInteger(n);
const isStr = (s: unknown): s is string => typeof s === "string";

function parse(raw: string | null): CartLine[] {
  if (!raw) return [];
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    const lines: CartLine[] = [];
    for (const l of data) {
      const i = l?.item;
      if (
        !i ||
        !isInt(i.id) ||
        !isStr(i.slug) ||
        !isStr(i.name) ||
        !isStr(i.category) ||
        !isInt(i.price) ||
        i.price < 0 ||
        !isStr(i.image) ||
        !isStr(i.alt) ||
        !isInt(i.stock) ||
        i.stock <= 0 ||
        !isInt(l.quantity)
      )
        continue;
      lines.push({
        item: {
          id: i.id,
          slug: i.slug,
          name: i.name,
          category: i.category,
          price: i.price,
          image: i.image,
          alt: i.alt,
          stock: i.stock,
        },
        quantity: Math.min(Math.max(1, l.quantity), i.stock),
      });
    }
    return lines;
  } catch {
    return [];
  }
}

// localStorage as an external store, so every tab and component stays in sync.
const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) cb();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
};
const readRaw = () => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};
const subscribeNever = () => () => {};

export function CartProvider({ children }: { children: ReactNode }) {
  const raw = useSyncExternalStore(subscribe, readRaw, () => null);
  // false during server render and hydration, true afterwards
  const ready = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
  const lines = useMemo(() => parse(raw), [raw]);

  const update = useCallback((fn: (prev: CartLine[]) => CartLine[]) => {
    const next = fn(parse(readRaw()));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage unavailable: nothing can be saved.
    }
    listeners.forEach((cb) => cb());
  }, []);

  const add = useCallback(
    (item: CartItem) => {
      if (item.stock <= 0) return; // sold out
      update((prev) => {
        const existing = prev.find((l) => l.item.id === item.id);
        if (!existing) return [...prev, { item, quantity: 1 }];
        return prev.map((l) =>
          l.item.id === item.id
            ? { item, quantity: Math.min(l.quantity + 1, item.stock) }
            : l,
        );
      });
    },
    [update],
  );

  const setQuantity = useCallback(
    (id: number, quantity: number) =>
      update((prev) =>
        prev.map((l) =>
          l.item.id === id
            ? { ...l, quantity: Math.min(Math.max(1, quantity), l.item.stock) }
            : l,
        ),
      ),
    [update],
  );

  const remove = useCallback(
    (id: number) => update((prev) => prev.filter((l) => l.item.id !== id)),
    [update],
  );

  const clear = useCallback(() => update(() => []), [update]);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      ready,
      count: lines.reduce((n, l) => n + l.quantity, 0),
      subtotal: lines.reduce((n, l) => n + l.item.price * l.quantity, 0),
      add,
      setQuantity,
      remove,
      clear,
    }),
    [lines, ready, add, setQuantity, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
