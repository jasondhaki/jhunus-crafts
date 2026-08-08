import type { AdminProductSearchParams } from "@/lib/admin/product-search-params";

// Same "options object explicitly says what changes" convention as
// buildShopUrl — sortable column headers pass { sort, page: 1 } (explicit
// reset), pagination links pass only { page } (keeps q/status/sort).
export function buildAdminProductsUrl(
  params: AdminProductSearchParams,
  overrides: Partial<AdminProductSearchParams> = {},
): string {
  const merged = { ...params, ...overrides };
  const usp = new URLSearchParams();
  if (merged.q) usp.set("q", merged.q);
  if (merged.status !== "all") usp.set("status", merged.status);
  if (merged.sort !== "newest") usp.set("sort", merged.sort);
  if (merged.page > 1) usp.set("page", String(merged.page));

  const query = usp.toString();
  return query ? `/admin/products?${query}` : "/admin/products";
}
