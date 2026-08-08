"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { formatPrice } from "@/lib/money";
import { cn } from "@/lib/utils";
import { InlineStockEditor } from "@/components/admin/inline-stock-editor";
import { ToggleActiveButton } from "@/components/admin/toggle-active-button";
import { BulkActionBar } from "@/components/admin/bulk-action-bar";
import { buildAdminProductsUrl } from "@/lib/admin/product-url";
import type { AdminProductSearchParams, ProductSortOption } from "@/lib/admin/product-search-params";

export interface AdminProductRow {
  id: string;
  title: string;
  priceCents: number;
  stock: number;
  isActive: boolean;
  images: string[];
  category: { name: string };
}

function SortableHeader({
  label,
  ascValue,
  descValue,
  params,
}: {
  label: string;
  ascValue: ProductSortOption;
  descValue: ProductSortOption;
  params: AdminProductSearchParams;
}) {
  const isAsc = params.sort === ascValue;
  const isDesc = params.sort === descValue;
  const nextSort = isAsc ? descValue : ascValue;

  return (
    <Link
      href={buildAdminProductsUrl(params, { sort: nextSort, page: 1 })}
      className={cn(
        "inline-flex items-center gap-1 hover:text-bark",
        (isAsc || isDesc) && "text-bark",
      )}
    >
      {label}
      {isAsc ? (
        <ArrowUp className="size-3.5" aria-hidden="true" />
      ) : isDesc ? (
        <ArrowDown className="size-3.5" aria-hidden="true" />
      ) : (
        <ArrowUpDown className="size-3.5 text-gray-300" aria-hidden="true" />
      )}
    </Link>
  );
}

export function AdminProductsTable({
  products,
  params,
}: {
  products: AdminProductRow[];
  params: AdminProductSearchParams;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const allSelected = products.length > 0 && products.every((product) => selected.has(product.id));

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(products.map((product) => product.id)));
  }

  function toggleOne(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (products.length === 0) {
    return (
      <p className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
        No products match your filters.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {selected.size > 0 && (
        <BulkActionBar selectedIds={[...selected]} onCleared={() => setSelected(new Set())} />
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Select all products"
                  className="size-4 accent-terracotta"
                />
              </th>
              <th className="px-2 py-3 font-medium">
                <SortableHeader label="Product" ascValue="title-asc" descValue="title-desc" params={params} />
              </th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">
                <SortableHeader label="Price" ascValue="price-asc" descValue="price-desc" params={params} />
              </th>
              <th className="px-4 py-3 font-medium">
                <SortableHeader label="Stock" ascValue="stock-asc" descValue="stock-desc" params={params} />
              </th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">
                <span className="sr-only">Edit</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((product) => (
              <tr
                key={product.id}
                className={product.isActive && product.stock <= 3 ? "bg-amber-50/60" : undefined}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(product.id)}
                    onChange={() => toggleOne(product.id)}
                    aria-label={`Select ${product.title}`}
                    className="size-4 accent-terracotta"
                  />
                </td>
                <td className="px-2 py-3">
                  <Link
                    href={`/admin/products/${product.id}`}
                    className="flex items-center gap-3 hover:text-terracotta"
                  >
                    <div className="relative size-10 shrink-0 overflow-hidden rounded bg-gray-100">
                      {product.images[0] && (
                        <Image src={product.images[0]} alt="" fill sizes="40px" className="object-cover" />
                      )}
                    </div>
                    <span className="font-medium text-bark">{product.title}</span>
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">{product.category.name}</td>
                <td className="px-4 py-3 text-gray-700">{formatPrice(product.priceCents)}</td>
                <td className="px-4 py-3">
                  <InlineStockEditor productId={product.id} initialStock={product.stock} />
                </td>
                <td className="px-4 py-3">
                  <ToggleActiveButton productId={product.id} isActive={product.isActive} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/products/${product.id}`}
                    className="text-xs font-medium text-terracotta hover:opacity-70"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
