"use client";

import { useEffect } from "react";
import "./globals.css";

// error.tsx cannot catch errors thrown by the root layout itself (e.g. the
// `await auth()` call in layout.tsx failing because the database is
// unreachable) — only errors in its children. This is the one boundary that
// can, per Next.js's root-layout-error convention, which is why it has to
// render its own <html>/<body> instead of relying on the ones in
// layout.tsx: if the root layout is what threw, that layout never mounted.
export default function GlobalError({
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
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col items-center justify-center bg-parchment px-6 text-center text-bark">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-jute">
          Something Frayed
        </p>
        <h1 className="mt-4 text-4xl font-semibold text-bark">
          We Hit a Snag on Our End
        </h1>
        <p className="mt-4 max-w-md text-jute">
          The site failed to load. Nothing on your end broke — try again in a
          moment.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-8 inline-flex h-11 items-center justify-center rounded-md bg-terracotta px-5 text-base font-medium text-cream transition-colors duration-200 ease-out hover:bg-terracotta/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jute focus-visible:ring-offset-2 focus-visible:ring-offset-parchment"
        >
          Try Again
        </button>
      </body>
    </html>
  );
}
