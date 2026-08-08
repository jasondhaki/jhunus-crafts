import Link from "next/link";
import { cn } from "@/lib/utils";
import type { AdminOrderSearchParams } from "@/lib/admin/order-search-params";

const LINK_CLASS =
  "inline-flex h-9 items-center justify-center rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-bark transition-colors duration-200 ease-out hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta";

function buildUrl(params: AdminOrderSearchParams, page: number): string {
  const usp = new URLSearchParams();
  if (params.status !== "all") usp.set("status", params.status);
  if (page > 1) usp.set("page", String(page));
  const query = usp.toString();
  return query ? `/admin/orders?${query}` : "/admin/orders";
}

export function AdminOrdersPagination({
  params,
  pageCount,
}: {
  params: AdminOrderSearchParams;
  pageCount: number;
}) {
  if (pageCount <= 1) return null;

  const isFirst = params.page <= 1;
  const isLast = params.page >= pageCount;

  return (
    <nav aria-label="Pagination" className="mt-6 flex items-center justify-center gap-2">
      <Link
        href={buildUrl(params, Math.max(1, params.page - 1))}
        aria-disabled={isFirst}
        tabIndex={isFirst ? -1 : undefined}
        className={cn(LINK_CLASS, isFirst && "pointer-events-none opacity-40")}
      >
        Previous
      </Link>
      <span className="px-3 text-sm text-gray-500">
        Page {params.page} of {pageCount}
      </span>
      <Link
        href={buildUrl(params, Math.min(pageCount, params.page + 1))}
        aria-disabled={isLast}
        tabIndex={isLast ? -1 : undefined}
        className={cn(LINK_CLASS, isLast && "pointer-events-none opacity-40")}
      >
        Next
      </Link>
    </nav>
  );
}
