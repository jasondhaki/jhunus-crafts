"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function NewsletterForm() {
  return (
    <form
      className="mt-4 flex gap-2"
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <Input
        type="email"
        name="email"
        placeholder="you@example.com"
        aria-label="Email address"
        required
        className="max-w-xs"
      />
      <Button type="submit" size="md">
        Subscribe
      </Button>
    </form>
  );
}
