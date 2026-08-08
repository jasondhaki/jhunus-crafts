import { Skeleton } from "@/components/ui/skeleton";

export function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 9 }).map((_, index) => (
        <div key={index} className="space-y-3">
          <Skeleton className="aspect-square w-full" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      ))}
    </div>
  );
}
