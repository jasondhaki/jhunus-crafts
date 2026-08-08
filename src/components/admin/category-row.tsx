"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/admin/submit-button";
import { deleteCategoryAction, renameCategoryAction } from "@/actions/admin/categories";
import { useActionToast } from "@/lib/use-action-toast";
import type { ActionResult } from "@/lib/admin/action-result";

const initialState: ActionResult = { success: false, message: "" };

interface CategoryRowData {
  id: string;
  name: string;
  slug: string;
  _count: { products: number };
}

export function CategoryRow({ category }: { category: CategoryRowData }) {
  const renameAction = renameCategoryAction.bind(null, category.id);
  const deleteAction = deleteCategoryAction.bind(null, category.id);

  const [renameState, renameFormAction] = useActionState(renameAction, initialState);
  const [deleteState, deleteFormAction] = useActionState(deleteAction, initialState);
  useActionToast(renameState);
  useActionToast(deleteState);

  const inUse = category._count.products > 0;

  return (
    <tr>
      <td className="px-4 py-3">
        <form action={renameFormAction} className="flex items-center gap-2">
          <Input
            name="name"
            defaultValue={category.name}
            className="h-8 max-w-xs text-sm"
            error={renameState.fieldErrors?.name?.[0]}
          />
          <SubmitButton size="sm" variant="secondary" className="text-xs">
            Save
          </SubmitButton>
        </form>
      </td>
      <td className="px-4 py-3 text-gray-500">/{category.slug}</td>
      <td className="px-4 py-3 text-gray-600">{category._count.products}</td>
      <td className="px-4 py-3 text-right">
        <form action={deleteFormAction}>
          <SubmitButton
            size="sm"
            variant="danger"
            className="text-xs"
            disabled={inUse}
            title={inUse ? "Can't delete a category still in use" : undefined}
          >
            Delete
          </SubmitButton>
        </form>
      </td>
    </tr>
  );
}
