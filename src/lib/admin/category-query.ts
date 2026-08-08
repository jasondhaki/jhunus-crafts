import { db } from "@/lib/db";

export async function getCategoriesWithProductCount() {
  return db.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
}
