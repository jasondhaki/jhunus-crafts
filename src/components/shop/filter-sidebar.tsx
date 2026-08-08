"use client";

import { useRef, useState } from "react";
import type { ReadonlyURLSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { useShopFilters } from "./use-shop-filters";

interface FilterSidebarProps {
  categories: { slug: string; name: string }[];
  weaves: string[];
}

const CHECKBOX_CLASS =
  "size-4 rounded border-hairline text-terracotta accent-terracotta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jute";

function PriceRangeInputs({
  searchParams,
  setValue,
}: {
  searchParams: ReadonlyURLSearchParams;
  setValue: (key: string, value: string | undefined) => void;
}) {
  const [minDraft, setMinDraft] = useState(searchParams.get("minPrice") ?? "");
  const [maxDraft, setMaxDraft] = useState(searchParams.get("maxPrice") ?? "");

  // Reset the drafts when the URL changes underneath us (e.g. a chip was
  // removed, or the back button was pressed) — adjusted during render
  // rather than in an effect, per React's "you might not need an effect".
  const [prevSearchParams, setPrevSearchParams] = useState(searchParams);
  if (searchParams !== prevSearchParams) {
    setPrevSearchParams(searchParams);
    setMinDraft(searchParams.get("minPrice") ?? "");
    setMaxDraft(searchParams.get("maxPrice") ?? "");
  }

  return (
    <div className="mt-3 flex items-center gap-2">
      <Input
        type="number"
        inputMode="numeric"
        min={0}
        placeholder="Min"
        value={minDraft}
        onChange={(event) => setMinDraft(event.target.value)}
        onBlur={() => setValue("minPrice", minDraft || undefined)}
        onKeyDown={(event) => {
          if (event.key === "Enter") setValue("minPrice", minDraft || undefined);
        }}
        aria-label="Minimum price"
      />
      <span className="text-jute" aria-hidden="true">
        –
      </span>
      <Input
        type="number"
        inputMode="numeric"
        min={0}
        placeholder="Max"
        value={maxDraft}
        onChange={(event) => setMaxDraft(event.target.value)}
        onBlur={() => setValue("maxPrice", maxDraft || undefined)}
        onKeyDown={(event) => {
          if (event.key === "Enter") setValue("maxPrice", maxDraft || undefined);
        }}
        aria-label="Maximum price"
      />
    </div>
  );
}

export function FilterSidebar({ categories, weaves }: FilterSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const { searchParams, isPending, toggleArrayValue, setValue, clearAll } = useShopFilters();
  const mobileDialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(mobileDialogRef, mobileOpen);

  const selectedCategories = searchParams.getAll("category");
  const selectedWeaves = searchParams.getAll("weave");
  const inStock = searchParams.get("inStock") === "true";

  const activeCount =
    selectedCategories.length +
    selectedWeaves.length +
    (inStock ? 1 : 0) +
    (searchParams.get("minPrice") ? 1 : 0) +
    (searchParams.get("maxPrice") ? 1 : 0);

  const content = (
    <div className={cn("space-y-8", isPending && "opacity-60")}>
      {categories.length > 0 && (
        <div>
          <h3 className="font-serif text-lg text-bark">Category</h3>
          <div className="mt-3 space-y-2">
            {categories.map((category) => (
              <label key={category.slug} className="flex items-center gap-2 text-sm text-bark">
                <input
                  type="checkbox"
                  className={CHECKBOX_CLASS}
                  checked={selectedCategories.includes(category.slug)}
                  onChange={() => toggleArrayValue("category", category.slug)}
                />
                {category.name}
              </label>
            ))}
          </div>
        </div>
      )}

      {categories.length > 0 && weaves.length > 0 && <Separator />}

      {weaves.length > 0 && (
        <div>
          <h3 className="font-serif text-lg text-bark">Weave</h3>
          <div className="mt-3 space-y-2">
            {weaves.map((weave) => (
              <label key={weave} className="flex items-center gap-2 text-sm text-bark">
                <input
                  type="checkbox"
                  className={CHECKBOX_CLASS}
                  checked={selectedWeaves.includes(weave)}
                  onChange={() => toggleArrayValue("weave", weave)}
                />
                {weave}
              </label>
            ))}
          </div>
        </div>
      )}

      <Separator />

      <div>
        <h3 className="font-serif text-lg text-bark">Price</h3>
        <PriceRangeInputs searchParams={searchParams} setValue={setValue} />
      </div>

      <Separator />

      <label className="flex items-center gap-2 text-sm text-bark">
        <input
          type="checkbox"
          className={CHECKBOX_CLASS}
          checked={inStock}
          onChange={(event) => setValue("inStock", event.target.checked ? "true" : undefined)}
        />
        In stock only
      </label>

      {activeCount > 0 && (
        <Button variant="ghost" size="sm" onClick={clearAll} className="w-full">
          Clear all
        </Button>
      )}
    </div>
  );

  return (
    <>
      <div className="hidden lg:block">
        <h2 className="font-serif text-xl text-bark">Filters</h2>
        <div className="mt-6">{content}</div>
      </div>

      <div className="mb-6 lg:hidden">
        <Button variant="secondary" size="sm" onClick={() => setMobileOpen(true)} className="gap-2">
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          Filters
          {activeCount > 0 && (
            <span className="flex size-5 items-center justify-center rounded-full bg-terracotta text-xs text-cream">
              {activeCount}
            </span>
          )}
        </Button>

        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                className="fixed inset-0 z-40 bg-bark/40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.2, ease: "easeOut" }}
                onClick={() => setMobileOpen(false)}
                aria-hidden="true"
              />
              <motion.div
                ref={mobileDialogRef}
                role="dialog"
                aria-modal="true"
                aria-label="Filters"
                className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-parchment p-6 shadow-xl"
                initial={shouldReduceMotion ? { opacity: 0 } : { y: "100%" }}
                animate={shouldReduceMotion ? { opacity: 1 } : { y: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { y: "100%" }}
                transition={{ duration: shouldReduceMotion ? 0.2 : 0.3, ease: "easeOut" }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-serif text-xl text-bark">Filters</span>
                  <button
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    aria-label="Close filters"
                    className="inline-flex size-10 items-center justify-center rounded-full transition-colors duration-200 ease-out hover:bg-jute/10"
                  >
                    <X className="size-5" aria-hidden="true" />
                  </button>
                </div>
                <div className="mt-6">{content}</div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
