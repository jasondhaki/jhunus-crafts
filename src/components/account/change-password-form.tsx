"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { changePasswordAction, type AccountActionState } from "@/actions/account";

const initialState: AccountActionState = {};

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="currentPassword" className="mb-1.5 block text-sm font-medium text-bark">
          Current Password
        </label>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          error={state.fieldErrors?.currentPassword?.[0]}
        />
      </div>
      <div>
        <label htmlFor="newPassword" className="mb-1.5 block text-sm font-medium text-bark">
          New Password
        </label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          error={state.fieldErrors?.newPassword?.[0]}
        />
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-terracotta">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="text-sm text-jute">
          {state.success}
        </p>
      )}
      <Button type="submit" loading={pending}>
        Change Password
      </Button>
    </form>
  );
}
