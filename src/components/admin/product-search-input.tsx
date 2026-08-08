"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function ProductSearchInput({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (query === (searchParams.get("q") ?? "")) return;

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (query) params.set("q", query);
      else params.delete("q");
      params.delete("page");
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    }, 350);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div className="relative w-full sm:max-w-xs">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400"
        aria-hidden="true"
      />
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search products…"
        className="pl-9"
        aria-label="Search products"
      />
    </div>
  );
}
