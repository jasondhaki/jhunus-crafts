"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCartHasHydrated, useCartStore } from "@/store/cart";
import { getCartDetails, type CartDetails } from "@/actions/cart";
import { getShippingMethod, type ShippingMethodId } from "@/lib/shipping";
import { checkoutRequestSchema } from "@/lib/checkout-schemas";
import { OrderSummaryMobile, OrderSummarySticky, type OrderSummaryProps } from "@/components/checkout/order-summary";
import { CheckoutDetailsForm, type CheckoutDetails } from "@/components/checkout/checkout-details-form";
import { PaymentStep } from "@/components/checkout/payment-step";
import type { OrderLineIssue } from "@/lib/checkout-order";

type Step = "details" | "payment";

interface CheckoutApiSuccess {
  clientSecret: string;
  orderNumber: string;
}

interface CheckoutApiConflict {
  error: string;
  lines: OrderLineIssue[];
}

export function CheckoutPageClient({ initialEmail }: { initialEmail?: string }) {
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const hasHydrated = useCartHasHydrated();

  const [cartDetails, setCartDetails] = useState<CartDetails | null>(null);
  const [step, setStep] = useState<Step>("details");
  const [shippingMethodId, setShippingMethodId] = useState<ShippingMethodId>("standard");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [lineIssues, setLineIssues] = useState<OrderLineIssue[]>([]);
  const [payment, setPayment] = useState<CheckoutApiSuccess | null>(null);
  const [summarySnapshot, setSummarySnapshot] = useState<OrderSummaryProps | null>(null);

  const itemsKey = items.map((item) => `${item.productId}:${item.quantity}`).join(",");

  useEffect(() => {
    if (!hasHydrated || step !== "details") return;
    let cancelled = false;
    getCartDetails(items).then((result) => {
      if (!cancelled) setCartDetails(result);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated, itemsKey, step]);

  const shippingCents = getShippingMethod(shippingMethodId)?.cents ?? 0;
  const subtotalCents = cartDetails?.subtotalCents ?? 0;
  const totalCents = subtotalCents + shippingCents;

  // Once payment starts, the order (and its PaymentIntent amount) is
  // already locked server-side — freeze what the summary rail shows to
  // whatever was true at submission time, so it can't drift out of sync
  // with a total the customer is about to be charged, even if they change
  // cart contents in another tab while the payment form is open.
  const displaySummary: OrderSummaryProps =
    step === "payment" && summarySnapshot
      ? summarySnapshot
      : {
          lines: cartDetails?.lines ?? [],
          adjustments: cartDetails?.adjustments ?? [],
          subtotalCents,
          shippingCents,
          totalCents,
        };

  async function handleDetailsSubmit(details: CheckoutDetails) {
    setSubmitting(true);
    setSubmitError(null);
    setLineIssues([]);

    const parsed = checkoutRequestSchema.safeParse({
      items,
      email: details.email,
      shippingAddress: details.shippingAddress,
      shippingMethodId: details.shippingMethodId,
    });

    if (!parsed.success) {
      setSubmitError("Please check your information and try again.");
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (response.status === 409) {
        const body: CheckoutApiConflict = await response.json();
        setLineIssues(body.lines);
        // Reflect what the server found immediately, so a retry doesn't
        // hit the exact same conflict.
        for (const issue of body.lines) {
          if (issue.availableStock <= 0) {
            removeItem(issue.productId);
          } else {
            updateQuantity(issue.productId, issue.availableStock);
          }
        }
        setSubmitting(false);
        return;
      }

      if (!response.ok) {
        // The route handler returns a specific, actionable message for
        // known outage modes (Stripe down, DB unreachable) — fall back to
        // a generic one only for responses we can't parse or didn't
        // anticipate.
        const fallback = "Something went wrong placing your order. Please try again.";
        const body: { error?: string } | null = await response.json().catch(() => null);
        setSubmitError(body?.error ?? fallback);
        setSubmitting(false);
        return;
      }

      const result: CheckoutApiSuccess = await response.json();
      setSummarySnapshot(displaySummary);
      setPayment(result);
      setStep("payment");
      setSubmitting(false);
    } catch {
      setSubmitError("A network error occurred. Please check your connection and try again.");
      setSubmitting(false);
    }
  }

  if (!hasHydrated) {
    return null;
  }

  if (step === "details" && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-hairline bg-cream py-24 text-center">
        <p className="font-serif text-2xl text-bark">Your cart is empty</p>
        <p className="mt-2 max-w-sm text-sm text-jute">
          Add something handwoven to your cart before checking out.
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-terracotta px-5 text-base font-medium text-cream transition-colors duration-200 ease-out hover:bg-terracotta/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jute focus-visible:ring-offset-2 focus-visible:ring-offset-parchment"
        >
          Browse the Shop
        </Link>
      </div>
    );
  }

  return (
    <div>
      <OrderSummaryMobile {...displaySummary} />

      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
        <div>
          {step === "details" ? (
            <CheckoutDetailsForm
              initialEmail={initialEmail}
              shippingMethodId={shippingMethodId}
              onShippingMethodChange={setShippingMethodId}
              submitting={submitting}
              submitError={submitError}
              lineIssues={lineIssues}
              onSubmit={handleDetailsSubmit}
            />
          ) : payment ? (
            <div className="space-y-6">
              <h2 className="font-serif text-2xl text-bark">Payment</h2>
              <PaymentStep clientSecret={payment.clientSecret} orderNumber={payment.orderNumber} />
            </div>
          ) : null}
        </div>

        <OrderSummarySticky {...displaySummary} />
      </div>
    </div>
  );
}
