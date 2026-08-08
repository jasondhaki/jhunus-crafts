import Link from "next/link";
import { cn } from "@/lib/utils";

const LINK_CLASS =
  "inline-flex h-10 items-center justify-center rounded-md border border-hairline px-4 text-sm font-medium text-bark transition-colors duration-200 ease-out hover:bg-jute/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jute focus-visible:ring-offset-2 focus-visible:ring-offset-parchment";

export function AccountPagination({
  basePath,
  page,
  pageCount,
}: {
  basePath: string;
  page: number;
  pageCount: number;
}) {
  if (pageCount <= 1) return null;

  const isFirst = page <= 1;
  const isLast = page >= pageCount;

  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-2">
      <Link
        href={`${basePath}?page=${Math.max(1, page - 1)}`}
        aria-disabled={isFirst}
        tabIndex={isFirst ? -1 : undefined}
        className={cn(LINK_CLASS, isFirst && "pointer-events-none opacity-40")}
      >
        Previous
      </Link>
      <span className="px-3 text-sm text-jute">
        Page {page} of {pageCount}
      </span>
      <Link
        href={`${basePath}?page=${Math.min(pageCount, page + 1)}`}
        aria-disabled={isLast}
        tabIndex={isLast ? -1 : undefined}
        className={cn(LINK_CLASS, isLast && "pointer-events-none opacity-40")}
      >
        Next
      </Link>
    </nav>
  );
}
