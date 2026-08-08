"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { formatPrice } from "@/lib/money";
import { useCartStore } from "@/store/cart";
import { getOrderStatus, type OrderStatus } from "@/actions/order";

const POLL_INTERVAL_MS = 3000;
// ~60s of polling before we stop assuming the webhook is just seconds
// behind and ask the user to check manually instead — covers an
// abandoned/expired PENDING order without polling forever.
const MAX_POLL_ATTEMPTS = 20;

const CONTINUE_SHOPPING_CLASS =
  "mt-8 inline-flex h-11 items-center justify-center rounded-md bg-terracotta px-5 text-base font-medium text-cream transition-colors duration-200 ease-out hover:bg-terracotta/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jute focus-visible:ring-offset-2 focus-visible:ring-offset-parchment";

export function CheckoutSuccessStatus({ initialOrder }: { initialOrder: OrderStatus }) {
  const [order, setOrder] = useState(initialOrder);
  const [pollAttempts, setPollAttempts] = useState(0);
  const clearCart = useCartStore((state) => state.clear);
  const hasClearedCartRef = useRef(false);

  const isConfirmed = order.status !== "PENDING" && order.status !== "CANCELLED";

  useEffect(() => {
    // The Stripe webhook is the only source of truth for a paid order
    // (CLAUDE.md rule 4) — this redirect can beat it by seconds, so the
    // cart is cleared exactly once, only after we've actually observed a
    // non-PENDING status here, never optimistically on arrival.
    if (isConfirmed && !hasClearedCartRef.current) {
      hasClearedCartRef.current = true;
      clearCart();
    }
  }, [isConfirmed, clearCart]);

  useEffect(() => {
    if (order.status !== "PENDING" || pollAttempts >= MAX_POLL_ATTEMPTS) return;

    const timer = setTimeout(async () => {
      const latest = await getOrderStatus(order.orderNumber);
      if (latest) setOrder(latest);
      setPollAttempts((count) => count + 1);
    }, POLL_INTERVAL_MS);

    return () => clearTimeout(timer);
  }, [order.status, order.orderNumber, pollAttempts]);

  if (order.status === "CANCELLED") {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <XCircle className="size-14 text-terracotta" aria-hidden="true" />
        <h1 className="mt-6 font-serif text-3xl text-bark">This order was cancelled</h1>
        <p className="mt-2 text-jute">
          Order <span className="font-medium text-bark">{order.orderNumber}</span> was not completed.
        </p>
        <Link href="/shop" className={CONTINUE_SHOPPING_CLASS}>
          Back to Shop
        </Link>
      </div>
    );
  }

  if (isConfirmed) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <CheckCircle2 className="size-14 text-terracotta" aria-hidden="true" />
        <h1 className="mt-6 font-serif text-3xl text-bark">Thank you for your order</h1>
        <p className="mt-2 text-jute">
          Order <span className="font-medium text-bark">{order.orderNumber}</span> is confirmed.
        </p>
        <p className="mt-1 text-sm text-jute">
          A confirmation has been sent to {order.email}. Total charged: {formatPrice(order.totalCents)}.
        </p>
        <Link href="/shop" className={CONTINUE_SHOPPING_CLASS}>
          Continue Shopping
        </Link>
      </div>
    );
  }

  const stillWaiting = pollAttempts < MAX_POLL_ATTEMPTS;

  return (
    <div className="flex flex-col items-center py-16 text-center">
      <Loader2 className="size-14 animate-spin text-terracotta" aria-hidden="true" />
      <h1 className="mt-6 font-serif text-3xl text-bark">Confirming your payment&hellip;</h1>
      <p className="mt-2 max-w-sm text-jute">
        Order <span className="font-medium text-bark">{order.orderNumber}</span> is on its way to being
        confirmed. This page will update automatically — no need to refresh.
      </p>
      {!stillWaiting && (
        <div className="mt-6">
          <p className="max-w-sm text-sm text-jute">
            This is taking longer than expected. If you completed payment, it should confirm shortly.
            Otherwise, check your email for a receipt or try checking out again.
          </p>
          <button
            type="button"
            onClick={() => setPollAttempts(0)}
            className="mt-4 inline-flex h-11 items-center justify-center rounded-md border border-jute px-5 text-base font-medium text-bark transition-colors duration-200 ease-out hover:bg-jute/5"
          >
            Check Again
          </button>
        </div>
      )}
    </div>
  );
}
