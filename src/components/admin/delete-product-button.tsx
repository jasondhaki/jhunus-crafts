"use client";

import { useActionState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteProductAction } from "@/actions/admin/products";
import { useActionToast } from "@/lib/use-action-toast";
import { SubmitButton } from "@/components/admin/submit-button";
import type { ActionResult } from "@/lib/admin/action-result";

const initialState: ActionResult = { success: false, message: "" };

export function DeleteProductButton({ productId }: { productId: string }) {
  const router = useRouter();
  const boundAction = deleteProductAction.bind(null, productId);
  const [state, formAction] = useActionState(boundAction, initialState);
  useActionToast(state);

  useEffect(() => {
    if (state.success) router.push("/admin/products");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (!window.confirm("Delete this product? If it's referenced by past orders, it will be deactivated instead.")) {
      event.preventDefault();
    }
  }

  return (
    <form action={formAction} onSubmit={handleSubmit}>
      <SubmitButton variant="danger" size="sm">
        <Trash2 className="size-4" aria-hidden="true" />
        Delete
      </SubmitButton>
    </form>
  );
}
