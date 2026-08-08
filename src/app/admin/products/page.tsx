import Link from "next/link";
import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth-guards";
import { getAdminProducts } from "@/lib/admin/product-query";
import { parseAdminProductSearchParams } from "@/lib/admin/product-search-params";
import { buildAdminProductsUrl } from "@/lib/admin/product-url";
import { cn } from "@/lib/utils";
import { ProductSearchInput } from "@/components/admin/product-search-input";
import { AdminProductsTable } from "@/components/admin/admin-products-table";
import { AdminProductsPagination } from "@/components/admin/admin-products-pagination";

export const metadata: Metadata = {
  title: "Products",
};

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
] as const;

export default async function AdminProductsPage({ searchParams }: PageProps<"/admin/products">) {
  await requireAdmin();
  const raw = await searchParams;
  const params = parseAdminProductSearchParams(raw);

  const { products, pageCount } = await getAdminProducts(params);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-bark">Products</h1>
        <Link
          href="/admin/products/new"
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-terracotta px-4 text-sm font-medium text-cream transition-colors duration-200 ease-out hover:bg-terracotta/90"
        >
          <Plus className="size-4" aria-hidden="true" />
          New Product
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <ProductSearchInput initialQuery={params.q} />
        <div className="flex gap-1 rounded-md border border-gray-300 bg-white p-1">
          {STATUS_TABS.map((tab) => (
            <Link
              key={tab.value}
              href={buildAdminProductsUrl(params, { status: tab.value, page: 1 })}
              className={cn(
                "rounded px-3 py-1 text-sm font-medium transition-colors duration-200 ease-out",
                params.status === tab.value ? "bg-terracotta text-cream" : "text-gray-600 hover:bg-gray-100",
              )}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      <AdminProductsTable products={products} params={params} />
      <AdminProductsPagination params={params} pageCount={pageCount} />
    </div>
  );
}
