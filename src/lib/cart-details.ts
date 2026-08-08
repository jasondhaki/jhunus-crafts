import { z } from "zod";

export const cartItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
});

// A cart of a few hundred one-of-a-kind handcrafted items is already an
// outlier — cap input size so a malformed/hostile cookie can't force an
// unbounded `findMany`.
export const cartItemsSchema = z.array(cartItemSchema).max(200);

export type CartItemInput = z.infer<typeof cartItemSchema>;

export interface CartLine {
  productId: string;
  slug: string;
  title: string;
  image: string | null;
  priceCents: number;
  compareAtCents: number | null;
  stock: number;
  quantity: number;
}

export interface CartAdjustment {
  productId: string;
  title: string;
  reason: "removed" | "clamped";
  previousQuantity: number;
  newQuantity?: number;
}

export interface CartDetails {
  lines: CartLine[];
  adjustments: CartAdjustment[];
  subtotalCents: number;
}

// The subset of Product fields getCartDetails actually needs, kept minimal
// and independent of Prisma's generated type so buildCartDetails can be
// unit-tested with plain fixtures.
export interface CartProductRecord {
  id: string;
  slug: string;
  title: string;
  images: string[];
  priceCents: number;
  compareAtCents: number | null;
  stock: number;
  isActive: boolean;
}

/**
 * Pure reconciliation of client-held (productId, quantity) pairs against
 * live product records. Never trusts the client's price — there isn't one
 * to trust, since the client never had it (CLAUDE.md rules 1 & 2). Products
 * that are missing, inactive, or out of stock are silently dropped;
 * quantities above current stock are clamped. Both cases are reported back
 * as adjustments so the UI can explain what changed instead of the cart
 * just silently shrinking.
 *
 * Lives outside src/actions/cart.ts because a "use server" file may only
 * export async functions — this stays a plain sync function so it's
 * trivially unit-testable.
 */
export function buildCartDetails(
  items: CartItemInput[],
  products: CartProductRecord[],
): CartDetails {
  const productById = new Map(products.map((product) => [product.id, product]));
  const lines: CartLine[] = [];
  const adjustments: CartAdjustment[] = [];

  for (const item of items) {
    const product = productById.get(item.productId);

    if (!product || !product.isActive || product.stock <= 0) {
      adjustments.push({
        productId: item.productId,
        title: product?.title ?? "This item",
        reason: "removed",
        previousQuantity: item.quantity,
      });
      continue;
    }

    const quantity = Math.min(item.quantity, product.stock);
    if (quantity !== item.quantity) {
      adjustments.push({
        productId: item.productId,
        title: product.title,
        reason: "clamped",
        previousQuantity: item.quantity,
        newQuantity: quantity,
      });
    }

    lines.push({
      productId: product.id,
      slug: product.slug,
      title: product.title,
      image: product.images[0] ?? null,
      priceCents: product.priceCents,
      compareAtCents: product.compareAtCents,
      stock: product.stock,
      quantity,
    });
  }

  const subtotalCents = lines.reduce((sum, line) => sum + line.priceCents * line.quantity, 0);

  return { lines, adjustments, subtotalCents };
}
