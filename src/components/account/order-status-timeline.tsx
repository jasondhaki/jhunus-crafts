import type { OrderStatus } from "@prisma/client";
import { Check, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ORDER_STATUS_LABEL, ORDER_STATUS_SEQUENCE } from "@/lib/order-status";

export function OrderStatusTimeline({ status }: { status: OrderStatus }) {
  if (status === "CANCELLED") {
    return (
      <div className="flex items-center gap-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <XCircle className="size-5 shrink-0" aria-hidden="true" />
        This order was cancelled.
      </div>
    );
  }

  const currentIndex = ORDER_STATUS_SEQUENCE.indexOf(status);

  return (
    <ol className="flex items-start overflow-x-auto pb-2">
      {ORDER_STATUS_SEQUENCE.map((step, index) => {
        const isComplete = index <= currentIndex;
        const isCurrent = index === currentIndex;
        const isLast = index === ORDER_STATUS_SEQUENCE.length - 1;

        return (
          <li key={step} className={cn("flex items-center", !isLast && "flex-1")}>
            <div className="flex shrink-0 flex-col items-center gap-2">
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-medium",
                  isComplete
                    ? "border-terracotta bg-terracotta text-cream"
                    : "border-hairline text-jute",
                )}
              >
                {isComplete ? <Check className="size-4" aria-hidden="true" /> : index + 1}
              </span>
              <span
                className={cn(
                  "w-20 shrink-0 text-center text-xs",
                  isCurrent ? "font-medium text-bark" : isComplete ? "text-bark" : "text-jute",
                )}
              >
                {ORDER_STATUS_LABEL[step]}
              </span>
            </div>
            {!isLast && (
              <div
                className={cn(
                  "mb-5 h-0.5 min-w-8 flex-1",
                  index < currentIndex ? "bg-terracotta" : "bg-hairline",
                )}
                aria-hidden="true"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
