import { db } from "@/lib/db";
import type { OrderStatusFilter } from "@/lib/admin/order-search-params";

export const ADMIN_ORDERS_PAGE_SIZE = 20;

export async function getAdminOrders(status: OrderStatusFilter, page: number) {
  const where = status === "all" ? {} : { status };
  const skip = (page - 1) * ADMIN_ORDERS_PAGE_SIZE;

  const [orders, total] = await db.$transaction([
    db.order.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: ADMIN_ORDERS_PAGE_SIZE }),
    db.order.count({ where }),
  ]);

  return { orders, total, pageCount: Math.max(1, Math.ceil(total / ADMIN_ORDERS_PAGE_SIZE)) };
}

// Unlike the customer-facing getOrderForUser, this is intentionally NOT
// scoped by userId — admins can view any order.
export async function getAdminOrderByNumber(orderNumber: string) {
  return db.order.findUnique({
    where: { orderNumber },
    include: { items: true, statusEvents: { orderBy: { createdAt: "desc" } } },
  });
}
