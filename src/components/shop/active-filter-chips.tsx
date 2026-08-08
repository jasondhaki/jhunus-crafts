"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useShopFilters } from "./use-shop-filters";

interface ActiveFilterChipsProps {
  categories: { slug: string; name: string }[];
}

export function ActiveFilterChips({ categories }: ActiveFilterChipsProps) {
  const { searchParams, removeValue, clearAll, isPending } = useShopFilters();

  const categoryNameBySlug = new Map(categories.map((category) => [category.slug, category.name]));

  const chips: { key: string; label: string; onRemove: () => void }[] = [];

  for (const slug of searchParams.getAll("category")) {
    chips.push({
      key: `category-${slug}`,
      label: categoryNameBySlug.get(slug) ?? slug,
      onRemove: () => removeValue("category", slug),
    });
  }
  for (const weave of searchParams.getAll("weave")) {
    chips.push({
      key: `weave-${weave}`,
      label: weave,
      onRemove: () => removeValue("weave", weave),
    });
  }
  const minPrice = searchParams.get("minPrice");
  if (minPrice) {
    chips.push({ key: "minPrice", label: `Min $${minPrice}`, onRemove: () => removeValue("minPrice") });
  }
  const maxPrice = searchParams.get("maxPrice");
  if (maxPrice) {
    chips.push({ key: "maxPrice", label: `Max $${maxPrice}`, onRemove: () => removeValue("maxPrice") });
  }
  if (searchParams.get("inStock") === "true") {
    chips.push({ key: "inStock", label: "In stock", onRemove: () => removeValue("inStock") });
  }

  if (chips.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", isPending && "opacity-60")}>
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.onRemove}
          className="inline-flex items-center gap-1.5 rounded-full bg-jute/10 px-3 py-1 text-sm font-medium text-jute transition-colors duration-200 ease-out hover:bg-jute/20"
        >
          {chip.label}
          <X className="size-3.5" aria-hidden="true" />
        </button>
      ))}
      <button
        type="button"
        onClick={clearAll}
        className="text-sm font-medium text-terracotta transition-colors duration-200 ease-out hover:opacity-70"
      >
        Clear all
      </button>
    </div>
  );
}
