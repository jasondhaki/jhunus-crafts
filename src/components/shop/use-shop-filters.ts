"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

// The URL is the single source of truth for filter state — this hook only
// ever reads from useSearchParams() and writes via router.push(). Nothing
// here is held in React state.
export function useShopFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function push(params: URLSearchParams) {
    const query = params.toString();
    startTransition(() => {
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  }

  /** Toggles a value within a multi-value param (category, weave) and resets to page 1. */
  function toggleArrayValue(key: string, value: string) {
    const params = new URLSearchParams(searchParams);
    const current = params.getAll(key);
    params.delete(key);
    const next = current.includes(value)
      ? current.filter((entry) => entry !== value)
      : [...current, value];
    for (const entry of next) params.append(key, entry);
    params.delete("page");
    push(params);
  }

  /** Sets (or clears, if value is undefined/empty) a single-value param and resets to page 1. */
  function setValue(key: string, value: string | undefined) {
    const params = new URLSearchParams(searchParams);
    if (value === undefined || value === "") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.delete("page");
    push(params);
  }

  /** Removes one value from a multi-value param, or the whole key if no value is given. */
  function removeValue(key: string, value?: string) {
    const params = new URLSearchParams(searchParams);
    if (value === undefined) {
      params.delete(key);
    } else {
      const remaining = params.getAll(key).filter((entry) => entry !== value);
      params.delete(key);
      for (const entry of remaining) params.append(key, entry);
    }
    params.delete("page");
    push(params);
  }

  function clearAll() {
    startTransition(() => {
      router.push(pathname, { scroll: false });
    });
  }

  function setPage(page: number) {
    const params = new URLSearchParams(searchParams);
    if (page <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(page));
    }
    push(params);
  }

  return { searchParams, isPending, toggleArrayValue, setValue, removeValue, clearAll, setPage };
}
