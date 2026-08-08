"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateNameAction, type AccountActionState } from "@/actions/account";

const initialState: AccountActionState = {};

export function UpdateNameForm({ initialName }: { initialName: string }) {
  const [state, formAction, pending] = useActionState(updateNameAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-bark">
          Name
        </label>
        <Input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          defaultValue={initialName}
          error={state.fieldErrors?.name?.[0]}
        />
      </div>
      {state.success && (
        <p role="status" className="text-sm text-jute">
          {state.success}
        </p>
      )}
      <Button type="submit" loading={pending}>
        Save Name
      </Button>
    </form>
  );
}
