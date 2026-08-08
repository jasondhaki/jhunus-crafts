"use client";

import { useState, useTransition } from "react";
import { RotateCcw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart";
import { reorderOrder, type ReorderPlan } from "@/actions/reorder";

export function ReorderButton({ orderNumber }: { orderNumber: string }) {
  const addItem = useCartStore((state) => state.addItem);
  const openCart = useCartStore((state) => state.open);
  const [isPending, startTransition] = useTransition();
  const [plan, setPlan] = useState<ReorderPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleReorder() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await reorderOrder(orderNumber);
        for (const line of result.added) {
          addItem(line.productId, line.quantity);
        }
        setPlan(result);
        if (result.added.length > 0) openCart();
      } catch {
        setError("Couldn't reorder right now. Please try again.");
      }
    });
  }

  return (
    <div>
      <Button type="button" variant="secondary" onClick={handleReorder} loading={isPending}>
        <RotateCcw className="size-4" aria-hidden="true" />
        Reorder
      </Button>

      {error && (
        <p role="alert" className="mt-3 text-sm text-terracotta">
          {error}
        </p>
      )}

      {plan && (plan.skipped.length > 0 || plan.adjusted.length > 0) && (
        <div
          role="status"
          className="mt-3 space-y-1 rounded-md border border-terracotta/40 bg-terracotta/10 p-3 text-sm text-terracotta"
        >
          {plan.skipped.map((item) => (
            <p key={item.title} className="flex gap-2">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>
                {item.title}{" "}
                {item.reason === "out_of_stock"
                  ? "is currently sold out and wasn't added."
                  : "is no longer available and wasn't added."}
              </span>
            </p>
          ))}
          {plan.adjusted.map((item) => (
            <p key={item.title} className="flex gap-2">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>
                Only {item.addedQuantity} of {item.title} could be added (requested{" "}
                {item.requestedQuantity}).
              </span>
            </p>
          ))}
        </div>
      )}

      {plan && plan.added.length > 0 && plan.skipped.length === 0 && plan.adjusted.length === 0 && (
        <p role="status" className="mt-3 text-sm text-jute">
          Added to your cart.
        </p>
      )}

      {plan && plan.added.length === 0 && plan.skipped.length > 0 && (
        <p className="mt-1 text-sm text-jute">Nothing from this order could be added.</p>
      )}
    </div>
  );
}
