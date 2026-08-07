import type { ShopSearchParams } from "@/lib/shop-search-params";

interface BuildShopUrlOptions {
  /** Page number to include. Omitted entirely when undefined or <= 1. */
  page?: number;
}

// Shared by pagination links and generateMetadata's canonical URL, so both
// agree on the same param ordering/omission rules (in particular: page is
// only ever included when explicitly requested and > 1).
export function buildShopUrl(params: ShopSearchParams, options: BuildShopUrlOptions = {}): string {
  const usp = new URLSearchParams();
  for (const category of params.category) usp.append("category", category);
  for (const weave of params.weave) usp.append("weave", weave);
  if (params.minPrice !== undefined) usp.set("minPrice", String(params.minPrice));
  if (params.maxPrice !== undefined) usp.set("maxPrice", String(params.maxPrice));
  if (params.inStock) usp.set("inStock", "true");
  if (params.sort !== "newest") usp.set("sort", params.sort);

  if (options.page !== undefined && options.page > 1) {
    usp.set("page", String(options.page));
  }

  const query = usp.toString();
  return query ? `/shop?${query}` : "/shop";
}
