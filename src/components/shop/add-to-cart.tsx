"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { Check, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart";
import { checkStock } from "@/actions/cart";

type Status = "idle" | "added" | "unavailable";

export function AddToCart({ productId, stock }: { productId: string; stock: number }) {
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState<Status>("idle");
  const [isPending, startTransition] = useTransition();
  const items = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const openCart = useCartStore((state) => state.open);
  const statusResetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const inputId = useId();
  const isSoldOut = stock <= 0;

  useEffect(() => {
    return () => clearTimeout(statusResetTimer.current);
  }, []);

  function decrement() {
    setQuantity((value) => Math.max(1, value - 1));
  }

  function increment() {
    setQuantity((value) => Math.min(stock, value + 1));
  }

  function handleAddToCart() {
    if (isSoldOut) return;

    const existingQuantity = items.find((item) => item.productId === productId)?.quantity ?? 0;
    const desiredTotal = existingQuantity + quantity;

    // Optimistic: the cookie-backed cart and the drawer update immediately.
    // The server round-trip below only reconciles the edge case where
    // stock changed since the page loaded — it never blocks the UI.
    addItem(productId, quantity);
    openCart();
    setStatus("added");
    clearTimeout(statusResetTimer.current);
    statusResetTimer.current = setTimeout(() => setStatus("idle"), 2000);

    startTransition(async () => {
      try {
        const result = await checkStock(productId, desiredTotal);
        if (!result.ok) {
          updateQuantity(productId, result.availableStock);
          if (result.availableStock <= 0) setStatus("unavailable");
        }
      } catch (error) {
        // Non-critical reconciliation — the authoritative check still runs
        // again at checkout, so a network hiccup here just means the user
        // finds out one step later instead of instantly.
        console.error("checkStock failed", error);
      }
    });
  }

  return (
    <div className="space-y-4">
      {!isSoldOut && (
        <div>
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-bark">
            Quantity
          </label>
          <div className="inline-flex items-center rounded-md border border-hairline">
            <button
              type="button"
              onClick={decrement}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
              className="inline-flex size-10 items-center justify-center text-bark transition-colors duration-200 ease-out hover:bg-jute/10 disabled:pointer-events-none disabled:opacity-40"
            >
              <Minus className="size-4" aria-hidden="true" />
            </button>
            <input
              id={inputId}
              type="text"
              inputMode="numeric"
              readOnly
              value={quantity}
              aria-live="polite"
              className="w-12 border-x border-hairline bg-transparent text-center text-bark"
            />
            <button
              type="button"
              onClick={increment}
              disabled={quantity >= stock}
              aria-label="Increase quantity"
              className="inline-flex size-10 items-center justify-center text-bark transition-colors duration-200 ease-out hover:bg-jute/10 disabled:pointer-events-none disabled:opacity-40"
            >
              <Plus className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {isSoldOut ? (
        <Button type="button" size="lg" disabled className="w-full">
          Sold Out
        </Button>
      ) : (
        <Button
          type="button"
          size="lg"
          className="w-full"
          onClick={handleAddToCart}
          loading={isPending && status !== "added"}
        >
          {status === "added" ? (
            <>
              <Check className="size-5" aria-hidden="true" />
              Added
            </>
          ) : (
            "Add to Cart"
          )}
        </Button>
      )}

      {status === "unavailable" && (
        <p className="text-sm text-terracotta" role="status">
          That much stock is no longer available — your cart was adjusted.
        </p>
      )}
    </div>
  );
}
