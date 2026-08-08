import { describe, expect, it } from "vitest";
import { wasStockDeducted } from "./order-stock";

describe("wasStockDeducted", () => {
  it("is false for PENDING — the webhook never deducted stock for an order that was never paid", () => {
    expect(wasStockDeducted("PENDING")).toBe(false);
  });

  it("is false for CANCELLED — already resolved one way or the other", () => {
    expect(wasStockDeducted("CANCELLED")).toBe(false);
  });

  it("is true for PAID — the instant the webhook deducts stock", () => {
    expect(wasStockDeducted("PAID")).toBe(true);
  });

  it("is true for every stage after PAID, since stock is never moved again downstream", () => {
    expect(wasStockDeducted("PROCESSING")).toBe(true);
    expect(wasStockDeducted("SHIPPED")).toBe(true);
    expect(wasStockDeducted("DELIVERED")).toBe(true);
  });
});
