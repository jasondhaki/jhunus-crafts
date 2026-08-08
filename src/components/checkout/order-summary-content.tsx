import Image from "next/image";
import { TriangleAlert } from "lucide-react";
import { formatPrice } from "@/lib/money";
import type { CartAdjustment, CartLine } from "@/actions/cart";

export function OrderSummaryContent({
  lines,
  adjustments,
  subtotalCents,
  shippingCents,
  totalCents,
}: {
  lines: CartLine[];
  adjustments: CartAdjustment[];
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
}) {
  return (
    <div className="space-y-6">
      {adjustments.length > 0 && (
        <div
          role="status"
          className="space-y-1 rounded-md border border-terracotta/40 bg-terracotta/10 p-3 text-sm text-terracotta"
        >
          {adjustments.map((adjustment) => (
            <p key={adjustment.productId} className="flex gap-2">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>
                {adjustment.reason === "removed"
                  ? `${adjustment.title} is no longer available and was removed.`
                  : `${adjustment.title} was reduced to ${adjustment.newQuantity} (limited stock).`}
              </span>
            </p>
          ))}
        </div>
      )}

      <ul className="space-y-4">
        {lines.map((line) => (
          <li key={line.productId} className="flex gap-3">
            <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-jute/10">
              {line.image && (
                <Image src={line.image} alt={line.title} fill sizes="64px" className="object-cover" />
              )}
              <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-bark text-[11px] font-semibold text-cream">
                {line.quantity}
              </span>
            </div>
            <div className="flex flex-1 items-start justify-between gap-2">
              <p className="text-sm text-bark">{line.title}</p>
              <p className="shrink-0 text-sm text-jute">
                {formatPrice(line.priceCents * line.quantity)}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <div className="space-y-2 border-t border-hairline pt-4 text-sm">
        <div className="flex justify-between text-jute">
          <span>Subtotal</span>
          <span>{formatPrice(subtotalCents)}</span>
        </div>
        <div className="flex justify-between text-jute">
          <span>Shipping</span>
          <span>{formatPrice(shippingCents)}</span>
        </div>
        <div className="flex justify-between border-t border-hairline pt-2 text-base font-medium text-bark">
          <span>Total</span>
          <span>{formatPrice(totalCents)}</span>
        </div>
      </div>
    </div>
  );
}
