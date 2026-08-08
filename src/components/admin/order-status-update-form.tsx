"use client";

import { useActionState } from "react";
import type { OrderStatus } from "@prisma/client";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/admin/submit-button";
import { updateOrderStatusAction } from "@/actions/admin/orders";
import { useActionToast } from "@/lib/use-action-toast";
import { ORDER_STATUS_VALUES } from "@/lib/admin/order-schema";
import type { ActionResult } from "@/lib/admin/action-result";

const initialState: ActionResult = { success: false, message: "" };

export function OrderStatusUpdateForm({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: OrderStatus;
}) {
  const [state, formAction] = useActionState(updateOrderStatusAction, initialState);
  useActionToast(state);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="orderId" value={orderId} />
      <div>
        <label htmlFor="status" className="mb-1.5 block text-sm font-medium text-bark">
          New Status
        </label>
        <Select id="status" name="status" defaultValue={currentStatus} error={state.fieldErrors?.status?.[0]}>
          {ORDER_STATUS_VALUES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label htmlFor="note" className="mb-1.5 block text-sm font-medium text-bark">
          Note <span className="font-normal text-gray-400">(optional — visible in the audit trail)</span>
        </label>
        <Textarea id="note" name="note" rows={3} error={state.fieldErrors?.note?.[0]} />
      </div>
      {state.message && !state.success && (
        <p role="alert" className="text-sm text-terracotta">
          {state.message}
        </p>
      )}
      <SubmitButton>Update Status</SubmitButton>
    </form>
  );
}
