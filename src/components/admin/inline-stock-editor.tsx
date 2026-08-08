"use client";

import { useActionState } from "react";
import { updateStockAction } from "@/actions/admin/products";
import { useActionToast } from "@/lib/use-action-toast";
import { SubmitButton } from "@/components/admin/submit-button";
import type { ActionResult } from "@/lib/admin/action-result";

const initialState: ActionResult = { success: false, message: "" };

export function InlineStockEditor({ productId, initialStock }: { productId: string; initialStock: number }) {
  const boundAction = updateStockAction.bind(null, productId);
  const [state, formAction] = useActionState(boundAction, initialState);
  useActionToast(state);

  return (
    <form action={formAction} className="flex items-center gap-1.5">
      <input
        type="number"
        name="stock"
        min={0}
        step={1}
        defaultValue={initialStock}
        aria-label="Stock quantity"
        className="w-16 rounded border border-gray-300 px-2 py-1 text-sm text-bark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
      />
      <SubmitButton size="sm" variant="secondary" className="px-2 text-xs">
        Save
      </SubmitButton>
    </form>
  );
}
