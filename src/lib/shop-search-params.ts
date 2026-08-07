import { z } from "zod";

export const SORT_OPTIONS = ["newest", "price-asc", "price-desc"] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === "string" && entry.length > 0);
  }
  if (typeof value === "string" && value.length > 0) {
    return [value];
  }
  return [];
}

function toOptionalNonNegativeNumber(value: unknown): number | undefined {
  if (value === undefined) return undefined;
  const num = Number(value);
  return Number.isFinite(num) && num >= 0 ? num : undefined;
}

function toSortOption(value: unknown): SortOption {
  return (SORT_OPTIONS as readonly unknown[]).includes(value) ? (value as SortOption) : "newest";
}

function toPositiveInt(value: unknown): number {
  const num = Number(value);
  return Number.isInteger(num) && num > 0 ? num : 1;
}

// Every field is normalized by its preprocessor before validation ever
// runs, so garbage input (wrong type, out-of-range, unknown enum value)
// always resolves to a valid default instead of failing the parse — the
// schema is structurally unable to throw on bad input.
export const shopSearchParamsSchema = z.object({
  category: z.preprocess(toStringArray, z.array(z.string())),
  weave: z.preprocess(toStringArray, z.array(z.string())),
  minPrice: z.preprocess(toOptionalNonNegativeNumber, z.number().nonnegative().optional()),
  maxPrice: z.preprocess(toOptionalNonNegativeNumber, z.number().nonnegative().optional()),
  inStock: z.preprocess((value) => value === "true" || value === "1", z.boolean()),
  sort: z.preprocess(toSortOption, z.enum(SORT_OPTIONS)),
  page: z.preprocess(toPositiveInt, z.number().int().positive()),
});

export type ShopSearchParams = z.infer<typeof shopSearchParamsSchema>;

export function parseShopSearchParams(
  raw: Record<string, string | string[] | undefined>,
): ShopSearchParams {
  const result = shopSearchParamsSchema.safeParse(raw);
  if (result.success) return result.data;

  // Unreachable given the preprocessors above always produce valid values,
  // but kept as an absolute guarantee that this function never throws.
  return shopSearchParamsSchema.parse({});
}
