"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { loginAction, signInWithGoogleAction, type FormActionState } from "@/actions/auth";

const initialState: FormActionState = {};

export function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? undefined;
  const [state, formAction, pending] = useActionState(
    loginAction.bind(null, callbackUrl),
    initialState,
  );

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-bark">
            Email
          </label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-bark">
            Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
        {state.error && (
          <p role="alert" className="text-sm text-terracotta">
            {state.error}
          </p>
        )}
        <Button type="submit" className="w-full" loading={pending}>
          Sign In
        </Button>
      </form>

      {googleEnabled && (
        <>
          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs uppercase tracking-wide text-jute">or</span>
            <Separator className="flex-1" />
          </div>
          <form action={signInWithGoogleAction}>
            <Button type="submit" variant="secondary" className="w-full">
              Continue with Google
            </Button>
          </form>
        </>
      )}

      <p className="text-center text-sm text-jute">
        New here?{" "}
        <Link href="/register" className="font-medium text-terracotta hover:opacity-70">
          Create an account
        </Link>
      </p>
    </div>
  );
}
