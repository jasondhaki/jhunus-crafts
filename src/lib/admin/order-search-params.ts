import { z } from "zod";

export const ORDER_STATUS_FILTERS = [
  "all",
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;
export type OrderStatusFilter = (typeof ORDER_STATUS_FILTERS)[number];

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function toStatus(value: unknown): OrderStatusFilter {
  return (ORDER_STATUS_FILTERS as readonly unknown[]).includes(value)
    ? (value as OrderStatusFilter)
    : "all";
}

function toPositiveInt(value: unknown): number {
  const num = Number(value);
  return Number.isInteger(num) && num > 0 ? num : 1;
}

const adminOrderSearchParamsSchema = z.object({
  status: z.preprocess(toStatus, z.enum(ORDER_STATUS_FILTERS)),
  page: z.preprocess(toPositiveInt, z.number().int().positive()),
});

export type AdminOrderSearchParams = z.infer<typeof adminOrderSearchParamsSchema>;

export function parseAdminOrderSearchParams(
  raw: Record<string, string | string[] | undefined>,
): AdminOrderSearchParams {
  return adminOrderSearchParamsSchema.parse({ status: first(raw.status), page: first(raw.page) });
}
