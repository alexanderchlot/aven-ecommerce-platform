import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";

// Email + password only. Email verification and email change are deliberately
// off until an email provider exists. Secrets come from the environment:
// BETTER_AUTH_SECRET and BETTER_AUTH_URL (never hard-code them here).
const appUrl = process.env.BETTER_AUTH_URL;

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  // Counts live in the `rate_limit` table so limits hold across serverless
  // instances. Enabled explicitly so it also applies in development.
  rateLimit: {
    enabled: true,
    storage: "database",
  },
  trustedOrigins: appUrl ? [appUrl] : [],
  plugins: [nextCookies()],
});
