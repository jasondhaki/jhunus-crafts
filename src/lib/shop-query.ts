import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { toCents } from "@/lib/money";
import type { ShopSearchParams } from "@/lib/shop-search-params";

export const SHOP_PAGE_SIZE = 12;

export async function getShopProducts(params: ShopSearchParams) {
  const where: Prisma.ProductWhereInput = {
    isActive: true,
    ...(params.category.length > 0 && { category: { slug: { in: params.category } } }),
    ...(params.weave.length > 0 && { weave: { in: params.weave } }),
    ...(params.inStock && { stock: { gt: 0 } }),
    ...((params.minPrice !== undefined || params.maxPrice !== undefined) && {
      priceCents: {
        ...(params.minPrice !== undefined && { gte: toCents(params.minPrice) }),
        ...(params.maxPrice !== undefined && { lte: toCents(params.maxPrice) }),
      },
    }),
  };

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    params.sort === "price-asc"
      ? { priceCents: "asc" }
      : params.sort === "price-desc"
        ? { priceCents: "desc" }
        : { createdAt: "desc" };

  const skip = (params.page - 1) * SHOP_PAGE_SIZE;

  // Both reads happen in one $transaction so the count matches the page
  // of results even if a product is created/deactivated between the two.
  const [products, total] = await db.$transaction([
    db.product.findMany({ where, orderBy, skip, take: SHOP_PAGE_SIZE }),
    db.product.count({ where }),
  ]);

  return {
    products,
    total,
    pageCount: Math.max(1, Math.ceil(total / SHOP_PAGE_SIZE)),
  };
}
