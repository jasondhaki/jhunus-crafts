import { forwardRef, useId, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, id, children, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;
    const errorId = error ? `${selectId}-error` : undefined;

    return (
      <div className="w-full">
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            aria-invalid={!!error || undefined}
            aria-describedby={errorId}
            className={cn(
              "w-full appearance-none rounded-md border border-hairline bg-cream px-3 py-2 pr-9 text-bark",
              "transition-colors duration-200 ease-out",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jute focus-visible:ring-offset-2 focus-visible:ring-offset-parchment",
              "disabled:pointer-events-none disabled:opacity-50",
              error && "border-terracotta focus-visible:ring-terracotta",
              className,
            )}
            {...props}
          >
            {children}
          </select>
          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-jute"
          />
        </div>
        {error && (
          <p id={errorId} role="alert" className="mt-1.5 text-sm text-terracotta">
            {error}
          </p>
        )}
      </div>
    );
  },
);
Select.displayName = "Select";
