import { db } from "@/lib/db";

export interface WishlistProduct {
  productId: string;
  slug: string;
  title: string;
  priceCents: number;
  compareAtCents: number | null;
  stock: number;
  images: string[];
}

// Shared by the public /wishlist page and the /account/wishlist page — same
// authenticated-owner query, same shape.
export async function getWishlistForUser(userId: string): Promise<WishlistProduct[]> {
  const items = await db.wishlistItem.findMany({
    where: { userId },
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });

  return items
    .filter((item) => item.product.isActive)
    .map((item) => ({
      productId: item.product.id,
      slug: item.product.slug,
      title: item.product.title,
      priceCents: item.product.priceCents,
      compareAtCents: item.product.compareAtCents,
      stock: item.product.stock,
      images: item.product.images,
    }));
}
