import type { OrderStatus } from "@prisma/client";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

// Status colors are a functional/semantic signal, not brand identity, so
// this is the one place the UI reaches outside the five CLAUDE.md tokens —
// per spec: PENDING amber, PAID/PROCESSING jute, SHIPPED/DELIVERED green,
// CANCELLED muted red.
export const ORDER_STATUS_PILL_CLASS: Record<OrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  PAID: "bg-jute/10 text-jute",
  PROCESSING: "bg-jute/10 text-jute",
  SHIPPED: "bg-emerald-100 text-emerald-800",
  DELIVERED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-red-100 text-red-700/70",
};

// The linear fulfillment sequence the status timeline walks. CANCELLED is
// deliberately excluded — it's a terminal branch off this line (reachable
// from PENDING or PAID), not a step on it.
export const ORDER_STATUS_SEQUENCE: OrderStatus[] = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
];
