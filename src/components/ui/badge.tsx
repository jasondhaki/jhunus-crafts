import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "sale" | "sold-out" | "low-stock";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  default: "bg-jute/10 text-jute",
  sale: "bg-terracotta text-cream",
  "sold-out": "bg-bark text-cream",
  "low-stock": "border border-terracotta text-terracotta",
};

export function Badge({ variant = "default", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide",
        VARIANT_STYLES[variant],
        className,
      )}
      {...props}
    />
  );
}
