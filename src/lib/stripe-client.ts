import { loadStripe, type Stripe } from "@stripe/stripe-js";

// loadStripe() should only ever be called once (it injects/reuses the
// stripe.js script tag) — cache the promise at module scope rather than
// inside a component.
let stripePromise: Promise<Stripe | null> | undefined;

export function getStripeClient(): Promise<Stripe | null> {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    stripePromise = publishableKey ? loadStripe(publishableKey) : Promise.resolve(null);
  }
  return stripePromise;
}
