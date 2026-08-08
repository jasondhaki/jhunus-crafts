import type { OrderStatus } from "@prisma/client";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ORDER_STATUS_LABEL, ORDER_STATUS_PILL_CLASS } from "@/lib/order-status";

interface StatusEvent {
  id: string;
  status: OrderStatus;
  note: string | null;
  createdAt: Date;
}

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

// Admin-only view of the manual audit trail (src/actions/admin/orders.ts)
// — deliberately distinct from the customer-facing OrderStatusTimeline,
// which shows fulfillment progress, not internal notes.
export function AdminOrderTimeline({ events }: { events: StatusEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-gray-500">No manual status changes yet.</p>;
  }

  return (
    <ol className="space-y-4">
      {events.map((event) => (
        <li key={event.id} className="flex gap-3">
          <span
            className={cn(
              "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full",
              ORDER_STATUS_PILL_CLASS[event.status],
            )}
          >
            <CheckCircle2 className="size-3.5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-medium text-bark">
              {ORDER_STATUS_LABEL[event.status]}
              <span className="ml-2 text-xs font-normal text-gray-400">
                {dateTimeFormatter.format(event.createdAt)}
              </span>
            </p>
            {event.note && <p className="mt-0.5 text-sm text-gray-600">{event.note}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
