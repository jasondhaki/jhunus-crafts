"use client";

import { useState, type FormEvent } from "react";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { getStripeClient } from "@/lib/stripe-client";
import { stripeAppearance } from "@/lib/stripe-appearance";

export function PaymentStep({
  clientSecret,
  orderNumber,
}: {
  clientSecret: string;
  orderNumber: string;
}) {
  return (
    <Elements
      stripe={getStripeClient()}
      options={{ clientSecret, appearance: stripeAppearance }}
    >
      <PaymentForm orderNumber={orderNumber} />
    </Elements>
  );
}

function PaymentForm({ orderNumber }: { orderNumber: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError(null);

    try {
      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success?order=${orderNumber}`,
        },
      });

      // confirmPayment only returns (rather than redirecting the browser
      // away) when confirmation failed outright — a card decline, an
      // invalid Payment Element, etc. Anything that succeeds navigates to
      // return_url instead, where the webhook (not this code) is the
      // actual source of truth for the order having been paid.
      if (confirmError) {
        setError(
          confirmError.message ??
            "Your payment could not be confirmed. Please check your details and try again.",
        );
        setSubmitting(false);
      }
    } catch {
      // A thrown (rather than returned) error means the request itself
      // never completed — e.g. the network dropped mid-confirmation. The
      // PaymentIntent is untouched, so retrying is safe.
      setError("A network error interrupted your payment. Please check your connection and try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />

      {error && (
        <p role="alert" className="text-sm text-terracotta">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" loading={submitting} disabled={!stripe}>
        Pay Now
      </Button>
    </form>
  );
}
