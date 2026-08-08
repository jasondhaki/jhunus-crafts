import { describe, expect, it } from "vitest";
import { buildCartDetails, type CartProductRecord } from "./cart-details";

function product(overrides: Partial<CartProductRecord> = {}): CartProductRecord {
  return {
    id: "p1",
    slug: "market-tote",
    title: "Market Tote",
    images: ["https://example.com/tote.jpg"],
    priceCents: 4800,
    compareAtCents: null,
    stock: 10,
    isActive: true,
    ...overrides,
  };
}

describe("buildCartDetails", () => {
  it("hydrates a line from a live product with a server-computed subtotal", () => {
    const result = buildCartDetails(
      [{ productId: "p1", quantity: 2 }],
      [product({ priceCents: 4800, stock: 10 })],
    );

    expect(result.lines).toEqual([
      {
        productId: "p1",
        slug: "market-tote",
        title: "Market Tote",
        image: "https://example.com/tote.jpg",
        priceCents: 4800,
        compareAtCents: null,
        stock: 10,
        quantity: 2,
      },
    ]);
    expect(result.subtotalCents).toBe(9600);
    expect(result.adjustments).toEqual([]);
  });

  it("drops a line whose product no longer exists and reports it as removed", () => {
    const result = buildCartDetails([{ productId: "ghost", quantity: 1 }], []);

    expect(result.lines).toEqual([]);
    expect(result.adjustments).toEqual([
      { productId: "ghost", title: "This item", reason: "removed", previousQuantity: 1 },
    ]);
    expect(result.subtotalCents).toBe(0);
  });

  it("drops a line whose product went inactive", () => {
    const result = buildCartDetails(
      [{ productId: "p1", quantity: 1 }],
      [product({ isActive: false })],
    );

    expect(result.lines).toEqual([]);
    expect(result.adjustments).toEqual([
      { productId: "p1", title: "Market Tote", reason: "removed", previousQuantity: 1 },
    ]);
  });

  it("drops a line whose product is out of stock", () => {
    const result = buildCartDetails([{ productId: "p1", quantity: 1 }], [product({ stock: 0 })]);

    expect(result.lines).toEqual([]);
    expect(result.adjustments).toEqual([
      { productId: "p1", title: "Market Tote", reason: "removed", previousQuantity: 1 },
    ]);
  });

  it("clamps a requested quantity above current stock and reports it", () => {
    const result = buildCartDetails(
      [{ productId: "p1", quantity: 5 }],
      [product({ stock: 3 })],
    );

    expect(result.lines).toEqual([
      expect.objectContaining({ productId: "p1", quantity: 3, stock: 3 }),
    ]);
    expect(result.adjustments).toEqual([
      { productId: "p1", title: "Market Tote", reason: "clamped", previousQuantity: 5, newQuantity: 3 },
    ]);
    expect(result.subtotalCents).toBe(4800 * 3);
  });

  it("does not report an adjustment when the requested quantity fits within stock", () => {
    const result = buildCartDetails([{ productId: "p1", quantity: 3 }], [product({ stock: 3 })]);

    expect(result.adjustments).toEqual([]);
    expect(result.lines[0].quantity).toBe(3);
  });

  it("handles a mix of valid, clamped, and dropped lines independently", () => {
    const result = buildCartDetails(
      [
        { productId: "p1", quantity: 2 },
        { productId: "p2", quantity: 8 },
        { productId: "p3", quantity: 1 },
      ],
      [
        product({ id: "p1", stock: 10 }),
        product({ id: "p2", title: "Woven Basket", priceCents: 3200, stock: 4 }),
      ],
    );

    expect(result.lines.map((line) => line.productId)).toEqual(["p1", "p2"]);
    expect(result.lines.find((line) => line.productId === "p2")?.quantity).toBe(4);
    expect(result.adjustments).toEqual([
      { productId: "p2", title: "Woven Basket", reason: "clamped", previousQuantity: 8, newQuantity: 4 },
      { productId: "p3", title: "This item", reason: "removed", previousQuantity: 1 },
    ]);
    expect(result.subtotalCents).toBe(4800 * 2 + 3200 * 4);
  });

  it("returns an empty result for an empty cart", () => {
    const result = buildCartDetails([], []);
    expect(result).toEqual({ lines: [], adjustments: [], subtotalCents: 0 });
  });
});
