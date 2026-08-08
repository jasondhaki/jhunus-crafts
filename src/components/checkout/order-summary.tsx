import { ChevronDown } from "lucide-react";
import { formatPrice } from "@/lib/money";
import { OrderSummaryContent } from "@/components/checkout/order-summary-content";
import type { CartAdjustment, CartLine } from "@/actions/cart";

export interface OrderSummaryProps {
  lines: CartLine[];
  adjustments: CartAdjustment[];
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
}

// Rendered from two different call sites deliberately: a collapsible
// <details> block placed at the top of the page on mobile, and a plain
// sticky rail placed in the right-hand grid column on desktop. A single
// element can't be "collapsible on mobile, always-open and positioned in a
// grid column on desktop" — <details> has no responsive-breakpoint concept
// — so each gets its own wrapper, both built on the same inner content.

export function OrderSummaryMobile(props: OrderSummaryProps) {
  return (
    <details className="group mb-8 rounded-lg border border-hairline bg-cream lg:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between p-4 [&::-webkit-details-marker]:hidden">
        <span className="font-serif text-lg text-bark">
          Order Summary
          <ChevronDown
            className="ml-2 inline-block size-4 text-jute transition-transform duration-200 ease-out group-open:rotate-180"
            aria-hidden="true"
          />
        </span>
        <span className="font-medium text-bark">{formatPrice(props.totalCents)}</span>
      </summary>
      <div className="border-t border-hairline p-4">
        <OrderSummaryContent {...props} />
      </div>
    </details>
  );
}

export function OrderSummarySticky(props: OrderSummaryProps) {
  return (
    <div className="hidden lg:block">
      <div className="sticky top-24 rounded-lg border border-hairline bg-cream p-6">
        <h2 className="font-serif text-xl text-bark">Order Summary</h2>
        <div className="mt-4">
          <OrderSummaryContent {...props} />
        </div>
      </div>
    </div>
  );
}
