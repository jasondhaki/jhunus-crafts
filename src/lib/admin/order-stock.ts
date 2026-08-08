import type { OrderStatus } from "@prisma/client";

/**
 * Stock is deducted exactly once — by the Stripe webhook, the instant an
 * order first becomes PAID — and never moved again across PROCESSING/
 * SHIPPED/DELIVERED (see src/app/api/webhooks/stripe/route.ts). So
 * "is stock currently held against this order" is fully determined by its
 * *current* status: anything except PENDING (payment never completed) or
 * CANCELLED (already resolved, one way or the other) means yes.
 *
 * This is what decides whether an admin cancelling an order needs to
 * restore stock atomically, or whether there's nothing to restore.
 */
export function wasStockDeducted(currentStatus: OrderStatus): boolean {
  return currentStatus !== "PENDING" && currentStatus !== "CANCELLED";
}
