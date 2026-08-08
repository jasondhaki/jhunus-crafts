import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { AdminProductSearchParams } from "@/lib/admin/product-search-params";

// Denser than the storefront's 12/page — this table is a working tool, not
// a browsing experience.
export const ADMIN_PRODUCTS_PAGE_SIZE = 20;

export async function getAdminProducts(params: AdminProductSearchParams) {
  const where: Prisma.ProductWhereInput = {
    ...(params.q && { title: { contains: params.q, mode: "insensitive" } }),
    ...(params.status === "active" && { isActive: true }),
    ...(params.status === "inactive" && { isActive: false }),
  };

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    params.sort === "title-asc"
      ? { title: "asc" }
      : params.sort === "title-desc"
        ? { title: "desc" }
        : params.sort === "price-asc"
          ? { priceCents: "asc" }
          : params.sort === "price-desc"
            ? { priceCents: "desc" }
            : params.sort === "stock-asc"
              ? { stock: "asc" }
              : params.sort === "stock-desc"
                ? { stock: "desc" }
                : { createdAt: "desc" };

  const skip = (params.page - 1) * ADMIN_PRODUCTS_PAGE_SIZE;

  const [products, total] = await db.$transaction([
    db.product.findMany({
      where,
      orderBy,
      skip,
      take: ADMIN_PRODUCTS_PAGE_SIZE,
      include: { category: true },
    }),
    db.product.count({ where }),
  ]);

  return {
    products,
    total,
    pageCount: Math.max(1, Math.ceil(total / ADMIN_PRODUCTS_PAGE_SIZE)),
  };
}

export async function getProductForAdmin(id: string) {
  return db.product.findUnique({ where: { id } });
}

export async function getAllCategories() {
  return db.category.findMany({ orderBy: { name: "asc" } });
}
