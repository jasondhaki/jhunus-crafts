"use server";

import { z } from "zod";
import { db } from "@/lib/db";

export interface OrderStatus {
  orderNumber: string;
  status: "PENDING" | "PAID" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  email: string;
  totalCents: number;
  createdAt: string;
}

const orderNumberSchema = z.string().min(1).max(40);

/**
 * Looked up by orderNumber alone (no auth check) — this is the same
 * "unguessable confirmation code" pattern most guest checkouts use, since
 * requiring login would break guest checkout entirely. The code space
 * (8 chars from a 33-char alphabet, see order-number.ts) is large enough
 * that this isn't meaningfully enumerable. Only returns the minimal fields
 * the success page needs, never the shipping address or line items.
 */
export async function getOrderStatus(orderNumber: string): Promise<OrderStatus | null> {
  const parsed = orderNumberSchema.safeParse(orderNumber);
  if (!parsed.success) return null;

  const order = await db.order.findUnique({
    where: { orderNumber: parsed.data },
    select: { orderNumber: true, status: true, email: true, totalCents: true, createdAt: true },
  });

  if (!order) return null;

  return { ...order, createdAt: order.createdAt.toISOString() };
}
