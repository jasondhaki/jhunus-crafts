import { describe, expect, it } from "vitest";
import { buildOrderDraft, type CheckoutProductRecord } from "./checkout-order";

function product(overrides: Partial<CheckoutProductRecord> = {}): CheckoutProductRecord {
  return {
    id: "p1",
    title: "Market Tote",
    images: ["https://example.com/tote.jpg"],
    priceCents: 4800,
    stock: 10,
    isActive: true,
    ...overrides,
  };
}

describe("buildOrderDraft", () => {
  it("builds order item snapshots and a server-computed subtotal when every line is available", () => {
    const result = buildOrderDraft(
      [{ productId: "p1", quantity: 2 }],
      [product({ priceCents: 4800, stock: 10 })],
    );

    expect(result).toEqual({
      ok: true,
      items: [
        {
          productId: "p1",
          quantity: 2,
          unitPriceCents: 4800,
          titleSnapshot: "Market Tote",
          imageSnapshot: "https://example.com/tote.jpg",
        },
      ],
      subtotalCents: 9600,
    });
  });

  it("fails the whole draft when a product no longer exists", () => {
    const result = buildOrderDraft([{ productId: "ghost", quantity: 1 }], []);

    expect(result).toEqual({
      ok: false,
      issues: [{ productId: "ghost", title: "This item", requestedQuantity: 1, availableStock: 0 }],
    });
  });

  it("fails the whole draft when a product went inactive", () => {
    const result = buildOrderDraft(
      [{ productId: "p1", quantity: 1 }],
      [product({ isActive: false })],
    );

    expect(result).toEqual({
      ok: false,
      issues: [{ productId: "p1", title: "Market Tote", requestedQuantity: 1, availableStock: 0 }],
    });
  });

  it("fails the whole draft when requested quantity exceeds stock", () => {
    const result = buildOrderDraft([{ productId: "p1", quantity: 5 }], [product({ stock: 3 })]);

    expect(result).toEqual({
      ok: false,
      issues: [{ productId: "p1", title: "Market Tote", requestedQuantity: 5, availableStock: 3 }],
    });
  });

  it("succeeds when requested quantity exactly matches remaining stock", () => {
    const result = buildOrderDraft([{ productId: "p1", quantity: 3 }], [product({ stock: 3 })]);

    expect(result.ok).toBe(true);
  });

  it("reports every offending line, not just the first, and still fails as a whole", () => {
    const result = buildOrderDraft(
      [
        { productId: "p1", quantity: 20 },
        { productId: "p2", quantity: 1 },
        { productId: "p3", quantity: 1 },
      ],
      [
        product({ id: "p1", stock: 5 }),
        product({ id: "p3", title: "Woven Basket", stock: 2 }),
      ],
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toEqual([
        { productId: "p1", title: "Market Tote", requestedQuantity: 20, availableStock: 5 },
        { productId: "p2", title: "This item", requestedQuantity: 1, availableStock: 0 },
      ]);
    }
  });

  it("never partially succeeds — a single bad line drops the whole order, unlike the cart's clamping behavior", () => {
    const result = buildOrderDraft(
      [
        { productId: "p1", quantity: 1 },
        { productId: "p2", quantity: 999 },
      ],
      [product({ id: "p1", stock: 10 }), product({ id: "p2", title: "Woven Basket", stock: 4 })],
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].productId).toBe("p2");
    }
  });
});
