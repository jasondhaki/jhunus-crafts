"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guards";
import { updateOrderStatusSchema } from "@/lib/admin/order-schema";
import { wasStockDeducted } from "@/lib/admin/order-stock";
import type { ActionResult } from "@/lib/admin/action-result";

// Same reasoning as the Stripe webhook's stock-deduction transaction:
// Serializable is the strongest isolation Postgres offers, appropriate
// here because this can restore finite stock across multiple lines
// atomically alongside the status flip.
const TRANSACTION_OPTIONS = {
  maxWait: 5000,
  timeout: 10000,
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
};

export async function updateOrderStatusAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = updateOrderStatusSchema.safeParse({
    orderId: formData.get("orderId"),
    status: formData.get("status"),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    return {
      success: false,
      message: "Please fix the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { orderId, status, note } = parsed.data;

  const order = await db.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) {
    return { success: false, message: "Order not found." };
  }

  if (order.status === status) {
    return { success: false, message: `Order is already ${status}.` };
  }

  // Only restore stock when moving TO cancelled AND stock was actually
  // deducted for this order in the first place (see order-stock.ts) — an
  // admin cancelling a still-PENDING order (never paid, never deducted)
  // must not inflate inventory it never took.
  const shouldRestoreStock = status === "CANCELLED" && wasStockDeducted(order.status);

  await db.$transaction(async (tx) => {
    if (shouldRestoreStock) {
      for (const item of order.items) {
        await tx.product.updateMany({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }

    await tx.order.update({ where: { id: order.id }, data: { status } });
    await tx.orderStatusEvent.create({ data: { orderId: order.id, status, note: note || null } });
  }, TRANSACTION_OPTIONS);

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${order.orderNumber}`);
  revalidatePath("/account/orders");
  revalidatePath(`/account/orders/${order.orderNumber}`);

  return { success: true, message: `Order ${order.orderNumber} marked ${status}.` };
}
