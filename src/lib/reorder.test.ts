import { describe, expect, it } from "vitest";
import { buildReorderPlan, type ReorderProductRecord } from "./reorder";

function product(overrides: Partial<ReorderProductRecord> = {}): ReorderProductRecord {
  return { id: "p1", isActive: true, stock: 10, ...overrides };
}

describe("buildReorderPlan", () => {
  it("adds a line whose product is still fully available", () => {
    const plan = buildReorderPlan(
      [{ productId: "p1", quantity: 2, titleSnapshot: "Market Tote" }],
      [product({ stock: 10 })],
    );

    expect(plan).toEqual({
      added: [{ productId: "p1", quantity: 2 }],
      skipped: [],
      adjusted: [],
    });
  });

  it("skips a line whose product no longer exists", () => {
    const plan = buildReorderPlan(
      [{ productId: "ghost", quantity: 1, titleSnapshot: "Vanished Basket" }],
      [],
    );

    expect(plan).toEqual({
      added: [],
      skipped: [{ title: "Vanished Basket", reason: "unavailable" }],
      adjusted: [],
    });
  });

  it("skips a line whose product went inactive", () => {
    const plan = buildReorderPlan(
      [{ productId: "p1", quantity: 1, titleSnapshot: "Market Tote" }],
      [product({ isActive: false })],
    );

    expect(plan).toEqual({
      added: [],
      skipped: [{ title: "Market Tote", reason: "unavailable" }],
      adjusted: [],
    });
  });

  it("skips a line whose product is out of stock", () => {
    const plan = buildReorderPlan(
      [{ productId: "p1", quantity: 1, titleSnapshot: "Market Tote" }],
      [product({ stock: 0 })],
    );

    expect(plan).toEqual({
      added: [],
      skipped: [{ title: "Market Tote", reason: "out_of_stock" }],
      adjusted: [],
    });
  });

  it("clamps and reports an adjustment when stock is lower than the original quantity", () => {
    const plan = buildReorderPlan(
      [{ productId: "p1", quantity: 5, titleSnapshot: "Market Tote" }],
      [product({ stock: 2 })],
    );

    expect(plan).toEqual({
      added: [{ productId: "p1", quantity: 2 }],
      skipped: [],
      adjusted: [{ title: "Market Tote", requestedQuantity: 5, addedQuantity: 2 }],
    });
  });

  it("does not report an adjustment when stock exactly covers the original quantity", () => {
    const plan = buildReorderPlan(
      [{ productId: "p1", quantity: 3, titleSnapshot: "Market Tote" }],
      [product({ stock: 3 })],
    );

    expect(plan.adjusted).toEqual([]);
    expect(plan.added).toEqual([{ productId: "p1", quantity: 3 }]);
  });

  it("resolves each line of a mixed order independently", () => {
    const plan = buildReorderPlan(
      [
        { productId: "p1", quantity: 1, titleSnapshot: "Available Tote" },
        { productId: "p2", quantity: 8, titleSnapshot: "Limited Basket" },
        { productId: "p3", quantity: 1, titleSnapshot: "Discontinued Runner" },
        { productId: "p4", quantity: 1, titleSnapshot: "Sold Out Bowl" },
      ],
      [
        product({ id: "p1", stock: 10 }),
        product({ id: "p2", stock: 3 }),
        product({ id: "p4", stock: 0 }),
      ],
    );

    expect(plan.added).toEqual([
      { productId: "p1", quantity: 1 },
      { productId: "p2", quantity: 3 },
    ]);
    expect(plan.adjusted).toEqual([
      { title: "Limited Basket", requestedQuantity: 8, addedQuantity: 3 },
    ]);
    expect(plan.skipped).toEqual([
      { title: "Discontinued Runner", reason: "unavailable" },
      { title: "Sold Out Bowl", reason: "out_of_stock" },
    ]);
  });

  it("returns an empty plan for no items", () => {
    expect(buildReorderPlan([], [])).toEqual({ added: [], skipped: [], adjusted: [] });
  });
});
