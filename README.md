# AVEN — Full-Stack E-Commerce

AVEN is a modern full-stack e-commerce application built with Next.js, TypeScript, PostgreSQL, and Stripe. It features product browsing, authentication, a persistent shopping bag, secure checkout, webhook-driven order processing, and inventory management.

Payments run in Stripe **test mode only**; the Stripe client refuses live keys.

## Features

- **Storefront:** homepage, product pages, collection pages with URL-driven filtering and sorting, and search.
- **Shopping bag:** persists in the browser (localStorage) and is never trusted for prices or stock.
- **Authentication:** email and password sign-up and sign-in, account page, database-backed rate limiting.
- **Checkout:** Stripe Checkout (SEK, guest checkout allowed). The server re-reads prices and stock from the database before creating a session.
- **Orders and inventory:** orders are created only by a verified Stripe webhook, with atomic and idempotent stock updates.
- **Responsive design:** works on mobile, tablet, and desktop.

## Tech stack

| Area | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Cache Components), React 19 |
| Language | TypeScript |
| Database | Neon serverless PostgreSQL, Drizzle ORM and drizzle-kit migrations |
| Auth | Better Auth (email + password) |
| Payments | Stripe Checkout and webhooks (test mode) |
| Styling | Tailwind CSS v4 |

## Architecture

- **Catalog:** `categories` (1) ──< `products` (N). Prices are stored as integer öre (SEK, VAT included) and formatted with `formatPrice()` in `src/lib/catalog.ts`. All storefront reads go through `src/lib/queries.ts`, which uses `'use cache'` with the `products` cache tag. The tag is revalidated after stock or product changes.
- **Auth:** `src/lib/auth.ts` configures Better Auth with the Drizzle adapter. Route handlers live in `src/app/api/auth/[...all]/route.ts`; client components use `src/lib/auth-client.ts`.
- **Checkout flow:**
  1. The bag sends product ids and quantities to `POST /api/checkout`.
  2. The server re-reads prices and stock from the database and creates a Stripe Checkout session.
  3. After payment, Stripe calls `POST /api/stripe/webhook`.
  4. The webhook verifies the signature and records the order and stock change in **one atomic SQL statement**.
  5. `/checkout/success` is display-only and never writes data.
- **Inventory safety:** a unique `orders.stripe_session_id` makes webhook redeliveries safe (idempotent). Stock is only decremented where `stock_quantity >= quantity`. If a decrement fails, the whole statement rolls back and the order is stored as `needs_review`, so stock never goes negative.

## Local development

Requirements: Node.js 20.9 or newer, a Neon (or other PostgreSQL) database, a Stripe account in test mode, and the [Stripe CLI](https://docs.stripe.com/stripe-cli).

```bash
npm install
cp .env.example .env.local   # then fill in your own values
npm run db:migrate           # apply migrations
npm run db:seed              # sample catalog (idempotent for a fresh database)
npm run dev                  # http://localhost:3000
```

Environment variables (names only; never commit values):

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Pooled PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Auth secret (`openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | App base URL, also used for Stripe redirect URLs |
| `STRIPE_SECRET_KEY` | Stripe **test** key (`sk_test_…` or `rk_test_…`) |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret from `stripe listen` |

`next build` also needs `DATABASE_URL` because product pages are statically generated from the database.

Other scripts: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run db:generate`, `npm run db:studio`.

### Stripe test-mode workflow

Forward webhooks to your local server and copy the printed signing secret into `STRIPE_WEBHOOK_SECRET`:

```bash
stripe listen --events checkout.session.completed --forward-to localhost:3000/api/stripe/webhook
```

Then add products to the bag and check out with a [Stripe test card](https://docs.stripe.com/testing).

## Testing

There is no automated test suite yet. CI runs lint and type checking. Payment and inventory behavior was verified manually against a real database in Stripe test mode:

- A successful test payment created one order and one order item, and stock decreased by one.
- Replaying the same Stripe event created no duplicate order and did not decrease stock again.
- A declined test card created no order and left inventory unchanged.
- Cancelling Stripe Checkout returned to the cancellation page and preserved the shopping bag.

These are verified scenarios, not proof that every edge case is covered.

## Known limitations

- No admin dashboard (stock and catalog are managed through the database).
- No order emails and no customer order history yet. Email verification is off until an email provider is added.
- The `/collections` index and `/collections/gifts` routes are not built yet.
- No automated tests and no production deployment.
- Stripe is restricted to test mode.

## AI-assisted development

Parts of this project were developed with the help of Claude Code. Project conventions for AI tooling are documented in `CLAUDE.md`.

## License

AVEN is licensed under the [MIT License](LICENSE).
