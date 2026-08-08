import type { OrderStatus } from "@prisma/client";
import { db } from "@/lib/db";

export const LOW_STOCK_THRESHOLD = 3;

// "Revenue from PAID orders" means money that was actually captured — PAID
// and everything downstream of it (PROCESSING/SHIPPED/DELIVERED). Counting
// only the literal PAID status would make this month's revenue silently
// shrink every time an order moved into fulfillment, which isn't a real
// drop in revenue.
const REVENUE_STATUSES: OrderStatus[] = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"];

function startOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export async function getDashboardStats() {
  const monthStart = startOfMonth();

  const [revenueAgg, ordersThisMonth, lowStockCount, pendingReviewCount, recentOrders, lowStockProducts] =
    await Promise.all([
      db.order.aggregate({
        where: { status: { in: REVENUE_STATUSES }, createdAt: { gte: monthStart } },
        _sum: { totalCents: true },
      }),
      db.order.count({ where: { createdAt: { gte: monthStart } } }),
      db.product.count({ where: { isActive: true, stock: { lte: LOW_STOCK_THRESHOLD } } }),
      db.review.count({ where: { isApproved: false } }),
      db.order.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
      db.product.findMany({
        where: { isActive: true, stock: { lte: LOW_STOCK_THRESHOLD } },
        orderBy: { stock: "asc" },
        take: 10,
      }),
    ]);

  return {
    revenueThisMonthCents: revenueAgg._sum?.totalCents ?? 0,
    ordersThisMonth,
    lowStockCount,
    pendingReviewCount,
    recentOrders,
    lowStockProducts,
  };
}
