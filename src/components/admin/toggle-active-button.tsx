"use client";

import { useActionState } from "react";
import { toggleActiveAction } from "@/actions/admin/products";
import { useActionToast } from "@/lib/use-action-toast";
import { SubmitButton } from "@/components/admin/submit-button";
import type { ActionResult } from "@/lib/admin/action-result";

const initialState: ActionResult = { success: false, message: "" };

export function ToggleActiveButton({ productId, isActive }: { productId: string; isActive: boolean }) {
  const boundAction = toggleActiveAction.bind(null, productId);
  const [state, formAction] = useActionState(boundAction, initialState);
  useActionToast(state);

  return (
    <form action={formAction}>
      <SubmitButton
        size="sm"
        variant={isActive ? "secondary" : "primary"}
        className="px-2 text-xs"
      >
        {isActive ? "Active" : "Inactive"}
      </SubmitButton>
    </form>
  );
}
