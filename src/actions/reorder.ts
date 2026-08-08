"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth-guards";
import { getOrderForUser } from "@/lib/order-query";
import { buildReorderPlan, type ReorderPlan } from "@/lib/reorder";

export type { ReorderPlan } from "@/lib/reorder";

const orderNumberSchema = z.string().min(1).max(40);

export async function reorderOrder(orderNumber: string): Promise<ReorderPlan> {
  const user = await requireUser();
  const parsedOrderNumber = orderNumberSchema.parse(orderNumber);

  // Scoped by userId exactly like the order detail page — a reorder
  // request for someone else's order gets the same generic failure as one
  // for an order number that doesn't exist at all, never a hint either way.
  const order = await getOrderForUser(user.id, parsedOrderNumber);
  if (!order) {
    throw new Error("Order not found.");
  }

  const productIds = order.items.map((item) => item.productId);
  const products = await db.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, isActive: true, stock: true },
  });

  return buildReorderPlan(order.items, products);
}
