import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({
  rating,
  className,
}: {
  rating: number;
  className?: string;
}) {
  const rounded = Math.round(rating);

  return (
    <div className="flex items-center gap-0.5" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={cn(
            "size-4",
            index < rounded ? "fill-terracotta text-terracotta" : "text-jute/30",
            className,
          )}
        />
      ))}
    </div>
  );
}
