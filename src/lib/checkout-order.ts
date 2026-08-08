export interface CheckoutProductRecord {
  id: string;
  title: string;
  images: string[];
  priceCents: number;
  stock: number;
  isActive: boolean;
}

export interface OrderItemDraft {
  productId: string;
  quantity: number;
  unitPriceCents: number;
  titleSnapshot: string;
  imageSnapshot: string | null;
}

export interface OrderLineIssue {
  productId: string;
  title: string;
  requestedQuantity: number;
  availableStock: number;
}

export type OrderDraftResult =
  | { ok: true; items: OrderItemDraft[]; subtotalCents: number }
  | { ok: false; issues: OrderLineIssue[] };

/**
 * Re-validates every requested cart line against live product records and
 * builds the exact OrderItem snapshots (title/image/price at time of
 * purchase — CLAUDE.md rule 4's snapshot requirement) to persist.
 *
 * Unlike the cart drawer's buildCartDetails (which silently drops/clamps
 * bad lines so browsing can continue), this is all-or-nothing: a single
 * unavailable or under-stocked line fails the whole draft, because
 * checkout is the moment CLAUDE.md rule 3 requires an explicit stock
 * verification before any money changes hands — silently shrinking the
 * order here would mean charging for something the customer didn't agree
 * to. The caller uses `issues` to return a 409 with exactly which lines
 * are the problem.
 */
export function buildOrderDraft(
  items: { productId: string; quantity: number }[],
  products: CheckoutProductRecord[],
): OrderDraftResult {
  const productById = new Map(products.map((product) => [product.id, product]));
  const issues: OrderLineIssue[] = [];
  const orderItems: OrderItemDraft[] = [];

  for (const item of items) {
    const product = productById.get(item.productId);

    if (!product || !product.isActive) {
      issues.push({
        productId: item.productId,
        title: product?.title ?? "This item",
        requestedQuantity: item.quantity,
        availableStock: 0,
      });
      continue;
    }

    if (product.stock < item.quantity) {
      issues.push({
        productId: product.id,
        title: product.title,
        requestedQuantity: item.quantity,
        availableStock: product.stock,
      });
      continue;
    }

    orderItems.push({
      productId: product.id,
      quantity: item.quantity,
      unitPriceCents: product.priceCents,
      titleSnapshot: product.title,
      imageSnapshot: product.images[0] ?? null,
    });
  }

  if (issues.length > 0) {
    return { ok: false, issues };
  }

  const subtotalCents = orderItems.reduce(
    (sum, item) => sum + item.unitPriceCents * item.quantity,
    0,
  );

  return { ok: true, items: orderItems, subtotalCents };
}
