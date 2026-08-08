"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { buildCartDetails, cartItemsSchema } from "@/lib/cart-details";
import type { CartDetails, CartItemInput } from "@/lib/cart-details";

export type { CartItemInput, CartLine, CartAdjustment, CartDetails } from "@/lib/cart-details";

export async function getCartDetails(items: CartItemInput[]): Promise<CartDetails> {
  const parsed = cartItemsSchema.safeParse(items);
  if (!parsed.success || parsed.data.length === 0) {
    return { lines: [], adjustments: [], subtotalCents: 0 };
  }

  const products = await db.product.findMany({
    where: { id: { in: parsed.data.map((item) => item.productId) } },
  });

  return buildCartDetails(parsed.data, products);
}

export interface StockCheckResult {
  ok: boolean;
  availableStock: number;
}

// Used by AddToCart for an inline pre-check before accepting the optimistic
// add — the definitive check still happens in getCartDetails (drawer) and
// again at checkout, per CLAUDE.md rule 3 (never read-then-write for the
// actual deduction).
export async function checkStock(
  productId: string,
  requestedQuantity: number,
): Promise<StockCheckResult> {
  const parsedId = z.string().min(1).parse(productId);
  const parsedQuantity = z.number().int().positive().parse(requestedQuantity);

  const product = await db.product.findUnique({
    where: { id: parsedId },
    select: { stock: true, isActive: true },
  });

  if (!product || !product.isActive) {
    return { ok: false, availableStock: 0 };
  }

  return { ok: parsedQuantity <= product.stock, availableStock: product.stock };
}
