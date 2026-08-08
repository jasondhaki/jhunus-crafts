export interface ReorderLineInput {
  productId: string;
  quantity: number;
  titleSnapshot: string;
}

export interface ReorderProductRecord {
  id: string;
  isActive: boolean;
  stock: number;
}

export interface ReorderPlan {
  added: { productId: string; quantity: number }[];
  skipped: { title: string; reason: "unavailable" | "out_of_stock" }[];
  adjusted: { title: string; requestedQuantity: number; addedQuantity: number }[];
}

/**
 * Pure decision logic for "Reorder": for each historical line, decide
 * whether it can go back in the cart at all (product still exists and is
 * active, has stock > 0) and whether the original quantity still fits
 * (clamped to current stock otherwise). Never looks at the order's
 * snapshotted price/title for this decision — only live product state,
 * since what's being decided is "can this be bought again right now."
 *
 * Kept out of src/actions/reorder.ts (a "use server" file, which may only
 * export async functions) so this decision logic stays a plain,
 * unit-testable function — same pattern as buildCartDetails and
 * buildOrderDraft.
 */
export function buildReorderPlan(
  items: ReorderLineInput[],
  products: ReorderProductRecord[],
): ReorderPlan {
  const productById = new Map(products.map((product) => [product.id, product]));
  const added: ReorderPlan["added"] = [];
  const skipped: ReorderPlan["skipped"] = [];
  const adjusted: ReorderPlan["adjusted"] = [];

  for (const item of items) {
    const product = productById.get(item.productId);

    if (!product || !product.isActive) {
      skipped.push({ title: item.titleSnapshot, reason: "unavailable" });
      continue;
    }

    if (product.stock <= 0) {
      skipped.push({ title: item.titleSnapshot, reason: "out_of_stock" });
      continue;
    }

    const quantity = Math.min(item.quantity, product.stock);
    added.push({ productId: product.id, quantity });

    if (quantity !== item.quantity) {
      adjusted.push({
        title: item.titleSnapshot,
        requestedQuantity: item.quantity,
        addedQuantity: quantity,
      });
    }
  }

  return { added, skipped, adjusted };
}
