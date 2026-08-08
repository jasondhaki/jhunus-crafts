"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { registerAction, type FormActionState } from "@/actions/auth";

const initialState: FormActionState = {};

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, initialState);

  return (
    <div className="space-y-6">
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
            error={state.fieldErrors?.name?.[0]}
          />
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-bark">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            error={state.fieldErrors?.email?.[0]}
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-bark">
            Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            error={state.fieldErrors?.password?.[0]}
          />
        </div>
        {state.error && (
          <p role="alert" className="text-sm text-terracotta">
            {state.error}
          </p>
        )}
        <Button type="submit" className="w-full" loading={pending}>
          Create Account
        </Button>
      </form>

      <p className="text-center text-sm text-jute">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-terracotta hover:opacity-70">
          Sign in
        </Link>
      </p>
    </div>
  );
}
