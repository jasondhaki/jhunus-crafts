import type { OrderStatus } from "@prisma/client";
import { cn } from "@/lib/utils";
import { ORDER_STATUS_LABEL, ORDER_STATUS_PILL_CLASS } from "@/lib/order-status";

export function OrderStatusPill({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide",
        ORDER_STATUS_PILL_CLASS[status],
      )}
    >
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}
