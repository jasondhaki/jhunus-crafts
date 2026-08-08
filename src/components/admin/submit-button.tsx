"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "@/components/ui/button";

// useFormStatus() only reads context from the nearest enclosing <form>, so
// this must be a child of the form it submits — a top-level page/form
// component calling useFormStatus() on itself always sees pending: false.
export function SubmitButton({ children, disabled, ...props }: ButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" loading={pending} disabled={pending || disabled} {...props}>
      {children}
    </Button>
  );
}
