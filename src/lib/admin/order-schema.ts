import { z } from "zod";

export const ORDER_STATUS_VALUES = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

export const updateOrderStatusSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum(ORDER_STATUS_VALUES),
  note: z.string().trim().max(500).optional().or(z.literal("")),
});
