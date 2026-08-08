"use client";

import { useActionState, useEffect } from "react";
import { bulkSetActiveAction } from "@/actions/admin/products";
import { useActionToast } from "@/lib/use-action-toast";
import { SubmitButton } from "@/components/admin/submit-button";
import type { ActionResult } from "@/lib/admin/action-result";

const initialState: ActionResult = { success: false, message: "" };

export function BulkActionBar({
  selectedIds,
  onCleared,
}: {
  selectedIds: string[];
  onCleared: () => void;
}) {
  // Rebuilt fresh every render from the current selection — React always
  // uses whichever action reference is current at submit time, so this
  // stays correct as the selection changes between renders.
  const activateAction = bulkSetActiveAction.bind(null, selectedIds, true);
  const deactivateAction = bulkSetActiveAction.bind(null, selectedIds, false);

  const [activateState, activateFormAction] = useActionState(activateAction, initialState);
  const [deactivateState, deactivateFormAction] = useActionState(deactivateAction, initialState);

  useActionToast(activateState);
  useActionToast(deactivateState);

  useEffect(() => {
    if (activateState.success) onCleared();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activateState]);

  useEffect(() => {
    if (deactivateState.success) onCleared();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deactivateState]);

  return (
    <div className="flex items-center gap-3 rounded-md border border-terracotta/40 bg-terracotta/5 px-4 py-2.5 text-sm">
      <span className="font-medium text-bark">
        {selectedIds.length} selected
      </span>
      <form action={activateFormAction}>
        <SubmitButton size="sm" variant="secondary" className="text-xs">
          Activate
        </SubmitButton>
      </form>
      <form action={deactivateFormAction}>
        <SubmitButton size="sm" variant="secondary" className="text-xs">
          Deactivate
        </SubmitButton>
      </form>
    </div>
  );
}
