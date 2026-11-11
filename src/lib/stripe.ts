import Stripe from "stripe";

// Test mode only. The client refuses to start with a live key, so real money
// can never move from this code path until that guard is deliberately removed.
let client: Stripe | null = null;

export function getStripe(): Stripe {
  if (client) return client;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  if (!key.startsWith("sk_test_") && !key.startsWith("rk_test_")) {
    throw new Error("Stripe is restricted to test mode: use an sk_test_ or rk_test_ key");
  }
  client = new Stripe(key);
  return client;
}

/** Base URL used for Stripe redirect URLs (same value Better Auth uses). */
export function getAppUrl(): string {
  const url = process.env.BETTER_AUTH_URL;
  if (url) return url.replace(/\/$/, "");
  if (process.env.NODE_ENV === "production") {
    throw new Error("BETTER_AUTH_URL is not set");
  }
  return "http://localhost:3000";
}
