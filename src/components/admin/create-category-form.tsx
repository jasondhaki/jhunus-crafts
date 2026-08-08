"use client";

import { useActionState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/admin/submit-button";
import { createCategoryAction } from "@/actions/admin/categories";
import { useActionToast } from "@/lib/use-action-toast";
import type { ActionResult } from "@/lib/admin/action-result";

const initialState: ActionResult = { success: false, message: "" };

export function CreateCategoryForm() {
  const [state, formAction] = useActionState(createCategoryAction, initialState);
  useActionToast(state);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex items-end gap-2">
      <div className="flex-1">
        <label htmlFor="new-category-name" className="mb-1.5 block text-sm font-medium text-bark">
          New Category
        </label>
        <Input
          id="new-category-name"
          name="name"
          required
          placeholder="e.g. Baskets"
          error={state.fieldErrors?.name?.[0]}
        />
      </div>
      <SubmitButton>Add</SubmitButton>
    </form>
  );
}
