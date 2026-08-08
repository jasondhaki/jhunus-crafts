import { beforeEach, describe, expect, it } from "vitest";
import { useCartStore } from "./cart";

beforeEach(() => {
  useCartStore.setState({ items: [], isOpen: false, hasHydrated: false });
});

describe("cart store", () => {
  it("starts empty and closed", () => {
    const state = useCartStore.getState();
    expect(state.items).toEqual([]);
    expect(state.isOpen).toBe(false);
  });

  describe("addItem", () => {
    it("adds a new line with a default quantity of 1", () => {
      useCartStore.getState().addItem("p1");
      expect(useCartStore.getState().items).toEqual([{ productId: "p1", quantity: 1 }]);
    });

    it("adds a new line with an explicit quantity", () => {
      useCartStore.getState().addItem("p1", 3);
      expect(useCartStore.getState().items).toEqual([{ productId: "p1", quantity: 3 }]);
    });

    it("increments the quantity when the product is already in the cart", () => {
      useCartStore.getState().addItem("p1", 2);
      useCartStore.getState().addItem("p1", 3);
      expect(useCartStore.getState().items).toEqual([{ productId: "p1", quantity: 5 }]);
    });

    it("keeps separate lines for different products", () => {
      useCartStore.getState().addItem("p1");
      useCartStore.getState().addItem("p2", 2);
      expect(useCartStore.getState().items).toEqual([
        { productId: "p1", quantity: 1 },
        { productId: "p2", quantity: 2 },
      ]);
    });
  });

  describe("removeItem", () => {
    it("removes the matching line and leaves others untouched", () => {
      useCartStore.getState().addItem("p1");
      useCartStore.getState().addItem("p2");
      useCartStore.getState().removeItem("p1");
      expect(useCartStore.getState().items).toEqual([{ productId: "p2", quantity: 1 }]);
    });

    it("is a no-op when the product isn't in the cart", () => {
      useCartStore.getState().addItem("p1");
      useCartStore.getState().removeItem("does-not-exist");
      expect(useCartStore.getState().items).toEqual([{ productId: "p1", quantity: 1 }]);
    });
  });

  describe("updateQuantity", () => {
    it("sets an explicit quantity", () => {
      useCartStore.getState().addItem("p1");
      useCartStore.getState().updateQuantity("p1", 7);
      expect(useCartStore.getState().items).toEqual([{ productId: "p1", quantity: 7 }]);
    });

    it("removes the line when quantity drops to zero", () => {
      useCartStore.getState().addItem("p1");
      useCartStore.getState().updateQuantity("p1", 0);
      expect(useCartStore.getState().items).toEqual([]);
    });

    it("removes the line when quantity goes negative", () => {
      useCartStore.getState().addItem("p1");
      useCartStore.getState().updateQuantity("p1", -1);
      expect(useCartStore.getState().items).toEqual([]);
    });
  });

  describe("clear", () => {
    it("empties the cart", () => {
      useCartStore.getState().addItem("p1");
      useCartStore.getState().addItem("p2");
      useCartStore.getState().clear();
      expect(useCartStore.getState().items).toEqual([]);
    });
  });

  describe("drawer visibility", () => {
    it("open/close/toggle set isOpen correctly", () => {
      expect(useCartStore.getState().isOpen).toBe(false);

      useCartStore.getState().open();
      expect(useCartStore.getState().isOpen).toBe(true);

      useCartStore.getState().close();
      expect(useCartStore.getState().isOpen).toBe(false);

      useCartStore.getState().toggle();
      expect(useCartStore.getState().isOpen).toBe(true);
      useCartStore.getState().toggle();
      expect(useCartStore.getState().isOpen).toBe(false);
    });
  });
});
