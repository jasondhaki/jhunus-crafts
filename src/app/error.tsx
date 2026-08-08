"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="flex min-h-[70vh] flex-col items-center justify-center text-center">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-jute">
        Something Frayed
      </p>
      <h1 className="mt-4 font-serif text-4xl text-bark">
        We Hit a Snag on Our End
      </h1>
      <p className="mt-4 max-w-md text-jute">
        Something went wrong while loading this page. Nothing on your end
        broke — try again, or head back to the shop.
      </p>
      <div className="mt-8 flex gap-4">
        <Button variant="primary" onClick={reset}>
          Try Again
        </Button>
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-md border border-jute px-5 text-base font-medium text-bark transition-colors duration-200 ease-out hover:bg-jute/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jute focus-visible:ring-offset-2 focus-visible:ring-offset-parchment"
        >
          Back to Home
        </Link>
      </div>
    </Container>
  );
}
