"use client";

import { useActionState } from "react";
import { approveReviewAction, rejectReviewAction, unapproveReviewAction } from "@/actions/admin/reviews";
import { useActionToast } from "@/lib/use-action-toast";
import { SubmitButton } from "@/components/admin/submit-button";
import type { ActionResult } from "@/lib/admin/action-result";

const initialState: ActionResult = { success: false, message: "" };

export function PendingReviewActions({ reviewId }: { reviewId: string }) {
  const approveAction = approveReviewAction.bind(null, reviewId);
  const rejectAction = rejectReviewAction.bind(null, reviewId);
  const [approveState, approveFormAction] = useActionState(approveAction, initialState);
  const [rejectState, rejectFormAction] = useActionState(rejectAction, initialState);
  useActionToast(approveState);
  useActionToast(rejectState);

  return (
    <div className="flex shrink-0 gap-2">
      <form action={approveFormAction}>
        <SubmitButton size="sm">Approve</SubmitButton>
      </form>
      <form action={rejectFormAction}>
        <SubmitButton size="sm" variant="danger">
          Reject
        </SubmitButton>
      </form>
    </div>
  );
}

export function ApprovedReviewActions({ reviewId }: { reviewId: string }) {
  const boundAction = unapproveReviewAction.bind(null, reviewId);
  const [state, formAction] = useActionState(boundAction, initialState);
  useActionToast(state);

  return (
    <form action={formAction} className="shrink-0">
      <SubmitButton size="sm" variant="secondary">
        Move to Pending
      </SubmitButton>
    </form>
  );
}
