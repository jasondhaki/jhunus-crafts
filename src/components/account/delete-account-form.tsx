"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { deleteAccountAction, type AccountActionState } from "@/actions/account";
import { DELETE_CONFIRMATION_PHRASE } from "@/lib/account-schemas";

const initialState: AccountActionState = {};

export function DeleteAccountForm({ hasPassword }: { hasPassword: boolean }) {
  const [state, formAction, pending] = useActionState(deleteAccountAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {hasPassword && (
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
      )}
      <div>
        <label htmlFor="confirmation" className="mb-1.5 block text-sm font-medium text-bark">
          Type <span className="font-mono">{DELETE_CONFIRMATION_PHRASE}</span> to confirm
        </label>
        <Input
          id="confirmation"
          name="confirmation"
          type="text"
          autoComplete="off"
          required
          error={state.fieldErrors?.confirmation?.[0]}
        />
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-terracotta">
          {state.error}
        </p>
      )}
      <Button type="submit" variant="danger" loading={pending}>
        Delete Account
      </Button>
    </form>
  );
}
