import { db } from "@/lib/db";

const ORDERS_PAGE_SIZE = 10;

export async function getOrdersForUser(userId: string, page: number) {
  const safePage = Math.max(1, page);

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: (safePage - 1) * ORDERS_PAGE_SIZE,
      take: ORDERS_PAGE_SIZE,
      include: { items: true },
    }),
    db.order.count({ where: { userId } }),
  ]);

  return {
    orders,
    total,
    pageCount: Math.max(1, Math.ceil(total / ORDERS_PAGE_SIZE)),
  };
}

// Scoped by userId in the query itself, not filtered afterward — an order
// that exists but belongs to someone else must come back exactly like an
// order that doesn't exist at all (the caller 404s either way, never 403,
// so existence of other customers' orders is never confirmable).
export async function getOrderForUser(userId: string, orderNumber: string) {
  return db.order.findFirst({
    where: { orderNumber, userId },
    include: { items: true },
  });
}
