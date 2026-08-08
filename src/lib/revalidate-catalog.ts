import { revalidatePath } from "next/cache";

/**
 * Every catalog-affecting admin mutation (create/update/delete/stock/
 * active-toggle) calls this — it's the whole point of using Server
 * Actions for the admin CRUD rather than a plain API route: the
 * storefront's cached pages get invalidated in the same request that
 * made the change, not on the next ISR window.
 *
 * `oldSlug` is only passed when a product's slug just changed — the old
 * detail-page URL needs to be revalidated too, or a stale cached version
 * (or a stale 404 for a *new* slug that reused an old one) could linger.
 */
export function revalidateCatalogPaths(slug?: string | null, oldSlug?: string | null): void {
  revalidatePath("/shop");
  revalidatePath("/");
  revalidatePath("/admin/products");
  if (slug) revalidatePath(`/shop/${slug}`);
  if (oldSlug && oldSlug !== slug) revalidatePath(`/shop/${oldSlug}`);
}
