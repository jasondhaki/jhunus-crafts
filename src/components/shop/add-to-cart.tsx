"use client";

import { useId, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

// No cart store exists yet (Zustand cart is a separate, not-yet-built
// piece of the stack) — this wires up quantity + the button's visual/
// disabled states correctly, but the click handler is intentionally a
// stub until that store lands.
export function AddToCart({ stock }: { stock: number }) {
  const [quantity, setQuantity] = useState(1);
  const inputId = useId();
  const isSoldOut = stock <= 0;

  function decrement() {
    setQuantity((value) => Math.max(1, value - 1));
  }

  function increment() {
    setQuantity((value) => Math.min(stock, value + 1));
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
        <Button type="button" size="lg" className="w-full">
          Add to Cart
        </Button>
      )}
    </div>
  );
}
