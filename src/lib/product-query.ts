import { db } from "@/lib/db";

export async function getProductBySlug(slug: string) {
  return db.product.findUnique({
    where: { slug },
    include: {
      category: true,
      reviews: {
        where: { isApproved: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export type ProductWithDetails = NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>;

export async function getRelatedProducts(categoryId: string, excludeProductId: string, take = 4) {
  return db.product.findMany({
    where: {
      categoryId,
      isActive: true,
      id: { not: excludeProductId },
    },
    orderBy: { createdAt: "desc" },
    take,
  });
}
