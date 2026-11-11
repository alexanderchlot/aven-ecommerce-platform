# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Read first

`AGENTS.md` warns that this Next.js version (16.x, React 19.3) has breaking changes from what you may know. Read the relevant guide in `node_modules/next/dist/docs/` before writing Next-specific code. `next.config.ts` enables `cacheComponents` and `partialPrefetching`, and wires Tailwind v4 via a Turbopack loader rule (`@tailwindcss/turbopack`).

## Commands

```bash
npm run dev         # next dev (http://localhost:3000)
npm run build       # next build
npm run lint        # eslint
npm run typecheck   # tsc --noEmit
npm run db:generate # drizzle-kit: generate SQL migrations into ./drizzle
npm run db:migrate  # apply migrations
npm run db:push     # push schema directly (no migration files)
npm run db:studio   # Drizzle Studio
npm run db:seed     # idempotent sample catalog (categories + products); needs DATABASE_URL
```

There is no test runner configured yet.

## Environment

Copy `.env.example` to `.env.local`. Required: `DATABASE_URL` (pooled Neon Postgres string), `BETTER_AUTH_SECRET` (`openssl rand -base64 32`), `BETTER_AUTH_URL` (also the base URL for Stripe redirects). Stripe (test mode only): `STRIPE_SECRET_KEY` (`rk_test_`/`sk_test_`; `src/lib/stripe.ts` refuses live keys) and `STRIPE_WEBHOOK_SECRET` (`whsec_…` from `stripe listen`). `drizzle.config.ts` loads `.env.local` then `.env`.

## Architecture

Stack: Next.js App Router + Neon serverless Postgres + Drizzle ORM + Better Auth. Path alias `@/*` → `src/*`.

The data/auth wiring spans several files:
- `src/db/index.ts` builds the `db` client (`drizzle-orm/neon-http` over `@neondatabase/serverless`) using `DATABASE_URL`, passing in `src/db/schema.ts`.
- `src/lib/auth.ts` is the server-side Better Auth instance, using `drizzleAdapter(db, { provider: "pg" })` and the `nextCookies()` plugin.
- `src/app/api/auth/[...all]/route.ts` exposes Better Auth's handlers (`GET`, `POST`) via `toNextJsHandler(auth)`.
- `src/lib/auth-client.ts` is the browser-side `authClient` for client components.

Storefront data (products, categories, stock):
- `src/db/schema.ts` defines `categories` (1) ──< `products` (N). Stock is `products.stock_quantity` (0 = sold out). Prices are integer **öre** (`price_ore`, SEK, VAT included); `formatPrice()` in `src/lib/catalog.ts` takes öre and renders Swedish format (`8 900 kr`).
- `src/lib/queries.ts` is the only place pages read the catalog. Every query uses `'use cache'` + `cacheTag("products")` + `cacheLife("minutes")` (Cache Components is on); call `revalidateTag("products", { expire: 0 })` (two-argument form) after changing stock or products.
- `src/lib/catalog.ts` holds only static helpers/content (`formatPrice`, `stockStatus`, `navLinks`, hero `images`, `FREE_SHIPPING_THRESHOLD_ORE`).
- `generateStaticParams` on `/products/[slug]` reads the DB, so `next build` needs `DATABASE_URL`.

## Current state

- Catalog and auth migrations (`drizzle/0000_*`, `0001_*`) are applied; the catalog is seeded with `db:seed`. `next build` needs `DATABASE_URL`.
- Auth is email + password only (`emailAndPassword` in `src/lib/auth.ts`, min 8 chars). Email verification and email change are deliberately off until an email provider exists. Rate limiting is database-backed (`rate_limit` table). Auth tables (`user`, `session`, `account`, `verification`, `rate_limit`) live at the end of `src/db/schema.ts`; re-run `npx auth@latest generate` after adding auth plugins.
- Pages: `/sign-in`, `/sign-up`, `/account` (server session check inside `<Suspense>`; redirects to `/sign-in`). The header Account link switches to "Sign in" when signed out via `authClient.useSession()`.
- The cart (`CartProvider`, localStorage) is client-only and not linked to users; it is never trusted for prices or stock.
- Checkout (Stripe Checkout, test mode, SEK, guest allowed): the bag button POSTs ids + quantities to `/api/checkout`, which re-reads prices and stock from Neon and creates the session. Orders and stock changes are recorded ONLY by `/api/stripe/webhook` (verified signature) in one atomic SQL statement: unique `orders.stripe_session_id` makes redeliveries safe, stock is only decremented where `stock_quantity >= quantity`, and a failed decrement rolls everything back and stores the order as `needs_review`. `/checkout/success` is display-only. Local webhook testing: `stripe listen --events checkout.session.completed --forward-to localhost:3000/api/stripe/webhook`. No order emails or order history yet.
- Built: homepage, product pages, collection pages with URL-driven filter/sort (`src/lib/listing.ts`), search, bag, auth pages, checkout success/cancel. Nav links to `/collections/gifts` and `/collections` still 404.

## Design Guidelines

- All pages must be fully responsive and work on mobile, tablet, and desktop.


## Communication Guidelines

- Keep responses short, clear, and beginner-friendly.
- Explain important technical concepts in simple Swedish.
- After completing a task, briefly summarize:
  1. What changed.
  2. Whether the checks passed.
  3. Whether I need to make a decision.
- Avoid long technical reports unless I ask for details.
- When approval is needed, explain what I am approving in 1–3 sentences.
- Continue performing thorough checks, but report only the important results.


## Edge Cases & Testing

- Consider what could change between steps in a user flow.
- Test missing, deleted, or modified database records.
- Test duplicate requests and concurrent operations.
- Test what happens if an operation fails halfway through.
- For payments and inventory, ensure database updates are atomic (all or nothing) and idempotent (safe to repeat).
- Verify that failures do not leave inconsistent data.
- Never assume code works just because typecheck, lint, or build passes.
- Test critical flows against the actual database in a safe, reversible way.

## Stripe Checkout — Verified Tests

- Stripe Checkout is configured for test mode only. Never enable live payments without explicit approval.
- A successful test payment was verified end-to-end: one order and one order item were saved in Neon, and product stock decreased by one.
- Replaying the same Stripe event did not create a duplicate order or decrease stock again.
- A declined test card did not create an order or change inventory.
- Cancelling Stripe Checkout returned to the cancellation page and preserved the shopping bag.
- Order and order-item records were also inspected directly in Neon.
- The local webhook requires Stripe CLI listening and a valid STRIPE_WEBHOOK_SECRET. Never expose secrets.

## Test Mode & Test Data

- AVEN is a full-stack e-commerce application built with professional e-commerce practices. It runs in Stripe test mode only and is not set up for live payments. The cart localStorage key `atelier-cart-v1` is a legacy name from before the AVEN rename and is intentionally unchanged so existing carts keep working.
- Prefer existing tools and free solutions. Do not introduce paid services without explicit approval.
- Keep test orders and their inventory changes by default so they can be inspected and reused for development and testing.
- Never delete test orders, reset stock, or modify existing test data without explicit approval.
- Treat the successful checkout tests as verified scenarios, not proof that every possible edge case has been covered.
- Continue following the existing Edge Cases & Testing guidelines.