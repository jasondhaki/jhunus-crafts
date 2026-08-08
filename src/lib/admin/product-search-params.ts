import { z } from "zod";

export const PRODUCT_SORT_OPTIONS = [
  "newest",
  "title-asc",
  "title-desc",
  "price-asc",
  "price-desc",
  "stock-asc",
  "stock-desc",
] as const;
export type ProductSortOption = (typeof PRODUCT_SORT_OPTIONS)[number];

export const PRODUCT_STATUS_FILTERS = ["all", "active", "inactive"] as const;
export type ProductStatusFilter = (typeof PRODUCT_STATUS_FILTERS)[number];

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function toSort(value: unknown): ProductSortOption {
  return (PRODUCT_SORT_OPTIONS as readonly unknown[]).includes(value)
    ? (value as ProductSortOption)
    : "newest";
}

function toStatus(value: unknown): ProductStatusFilter {
  return (PRODUCT_STATUS_FILTERS as readonly unknown[]).includes(value)
    ? (value as ProductStatusFilter)
    : "all";
}

function toPositiveInt(value: unknown): number {
  const num = Number(value);
  return Number.isInteger(num) && num > 0 ? num : 1;
}

const adminProductSearchParamsSchema = z.object({
  q: z.preprocess((value) => (typeof value === "string" ? value.trim() : ""), z.string()),
  sort: z.preprocess(toSort, z.enum(PRODUCT_SORT_OPTIONS)),
  status: z.preprocess(toStatus, z.enum(PRODUCT_STATUS_FILTERS)),
  page: z.preprocess(toPositiveInt, z.number().int().positive()),
});

export type AdminProductSearchParams = z.infer<typeof adminProductSearchParamsSchema>;

export function parseAdminProductSearchParams(
  raw: Record<string, string | string[] | undefined>,
): AdminProductSearchParams {
  return adminProductSearchParamsSchema.parse({
    q: first(raw.q),
    sort: first(raw.sort),
    status: first(raw.status),
    page: first(raw.page),
  });
}
