// AUTH_URL already represents this app's canonical origin (used for
// NextAuth callback URLs), so it doubles as the site's public base URL
// rather than introducing a second env var for the same value.
export const SITE_URL = process.env.AUTH_URL ?? "http://localhost:3000";
export const SITE_NAME = "Jhunu's Crafts";
// Lowercase, ISO 4217 — the format Stripe's API expects for `currency`.
export const SITE_CURRENCY = "usd";
