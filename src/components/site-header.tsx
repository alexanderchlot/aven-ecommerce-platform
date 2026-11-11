"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart-provider";
import { authClient } from "@/lib/auth-client";
import {
  FREE_SHIPPING_THRESHOLD_ORE,
  formatPrice,
  navLinks,
} from "@/lib/catalog";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { count } = useCart();
  const { data: session, isPending } = authClient.useSession();
  // Signed out: send to sign-in. While loading, keep "Account" to avoid a flash.
  const accountHref = !isPending && !session ? "/sign-in" : "/account";
  const accountLabel = !isPending && !session ? "Sign in" : "Account";

  // Lock page scroll while the mobile menu is open; close on Escape.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <div className="bg-ink text-paper">
        <p className="label container-page py-2 text-center">
          Complimentary shipping on orders over {formatPrice(FREE_SHIPPING_THRESHOLD_ORE)}
        </p>
      </div>

      <header className="site-header">
        <div className="site-header__inner !grid grid-cols-[1fr_auto_1fr]">
          <div className="flex items-center">
            <button
              type="button"
              className="label py-3 lg:hidden"
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? "Close" : "Menu"}
            </button>
            <nav aria-label="Primary" className="hidden gap-6 lg:flex">
              {navLinks.map((item) => (
                <Link key={item.href} href={item.href} className="link-nav">
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <Link
            href="/"
            className="font-display text-2xl uppercase tracking-[0.3em] md:text-3xl"
            aria-label="AVEN home"
            onClick={() => setOpen(false)}
          >
            AVEN
          </Link>

          <div className="flex items-center justify-end gap-4 md:gap-6">
            <Link href="/search" className="link-nav hidden lg:inline-block">
              Search
            </Link>
            <Link href={accountHref} className="link-nav hidden lg:inline-block">
              {accountLabel}
            </Link>
            <Link href="/bag" className="link-nav">
              Bag ({count})
            </Link>
          </div>
        </div>
      </header>

      {open ? (
        <div
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className="fixed inset-0 z-50 overflow-y-auto bg-paper lg:hidden"
        >
          <div className="container-page flex h-header items-center justify-between border-b">
            <button type="button" className="label py-3" onClick={() => setOpen(false)}>
              Close
            </button>
            <span className="font-display text-2xl uppercase tracking-[0.3em]">
              AVEN
            </span>
            <span className="w-12" aria-hidden />
          </div>
          <nav aria-label="Mobile" className="container-page flex flex-col py-4">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="heading-2 border-b py-4"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-6 flex gap-6">
              <Link href="/search" className="link-nav" onClick={() => setOpen(false)}>
                Search
              </Link>
              <Link href={accountHref} className="link-nav" onClick={() => setOpen(false)}>
                {accountLabel}
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </>
  );
}
