import Link from "next/link";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-hairline bg-cream py-24 text-center">
      <p className="font-serif text-2xl text-bark">No pieces match those filters</p>
      <p className="mt-2 max-w-sm text-sm text-jute">
        Try widening your search, or start over with the full collection.
      </p>
      <Link
        href="/shop"
        className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-terracotta px-5 text-base font-medium text-cream transition-colors duration-200 ease-out hover:bg-terracotta/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jute focus-visible:ring-offset-2 focus-visible:ring-offset-parchment"
      >
        Clear Filters
      </Link>
    </div>
  );
}
