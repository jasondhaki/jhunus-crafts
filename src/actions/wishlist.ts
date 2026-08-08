"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth-guards";
import type { WishlistProduct } from "@/lib/wishlist-query";

export type { WishlistProduct } from "@/lib/wishlist-query";

const productIdSchema = z.string().min(1);
const productIdsSchema = z.array(productIdSchema).max(200);

// Guest wishlist hydration: takes the cookie-held productIds and returns
// live product data, same "never trust client-cached data" principle as
// the cart. Inactive/deleted products are silently dropped.
export async function getWishlistProducts(productIds: string[]): Promise<WishlistProduct[]> {
  const parsed = productIdsSchema.safeParse(productIds);
  if (!parsed.success || parsed.data.length === 0) return [];

  const products = await db.product.findMany({
    where: { id: { in: parsed.data }, isActive: true },
  });

  return products.map((product) => ({
    productId: product.id,
    slug: product.slug,
    title: product.title,
    priceCents: product.priceCents,
    compareAtCents: product.compareAtCents,
    stock: product.stock,
    images: product.images,
  }));
}

export async function addWishlistItem(productId: string): Promise<void> {
  const parsedId = productIdSchema.parse(productId);
  const user = await requireUser();

  await db.wishlistItem.upsert({
    where: { userId_productId: { userId: user.id, productId: parsedId } },
    update: {},
    create: { userId: user.id, productId: parsedId },
  });
}

export async function removeWishlistItem(productId: string): Promise<void> {
  const parsedId = productIdSchema.parse(productId);
  const user = await requireUser();

  await db.wishlistItem.deleteMany({ where: { userId: user.id, productId: parsedId } });
}

/**
 * Upserts every guest-wishlist productId into the database, deduping via
 * the @@unique([userId, productId]) constraint. Called exactly once per
 * session by WishlistMergeGate right after sign-in.
 */
export async function mergeGuestWishlist(productIds: string[]): Promise<void> {
  const parsed = productIdsSchema.safeParse(productIds);
  if (!parsed.success || parsed.data.length === 0) return;

  const user = await requireUser();
  const uniqueIds = [...new Set(parsed.data)];

  const results = await Promise.allSettled(
    uniqueIds.map((productId) =>
      db.wishlistItem.upsert({
        where: { userId_productId: { userId: user.id, productId } },
        update: {},
        create: { userId: user.id, productId },
      }),
    ),
  );

  for (const result of results) {
    if (result.status === "rejected") {
      // A guest-wishlisted product that was deleted since it was added
      // fails the FK constraint — skip it rather than fail the whole merge.
      console.error("mergeGuestWishlist: failed to upsert item", result.reason);
    }
  }
}
