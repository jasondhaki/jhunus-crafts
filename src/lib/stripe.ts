import Stripe from "stripe";

// Lazy singleton, not a top-level `new Stripe(...)` call — this module is
// imported by API route files, and constructing eagerly at module load
// would throw during `next build` in any environment (like CI) where
// STRIPE_SECRET_KEY isn't set, even though the routes are never executed
// at build time. Deliberately a plain function (not a Proxy) per the
// lazy-init guidance for build-time-unsafe clients.
let cachedStripe: Stripe | undefined;

export function getStripe(): Stripe {
  if (!cachedStripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    cachedStripe = new Stripe(secretKey);
  }
  return cachedStripe;
}
