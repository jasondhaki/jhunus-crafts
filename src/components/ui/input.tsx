import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const errorId = error ? `${inputId}-error` : undefined;

    return (
      <div className="w-full">
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error || undefined}
          aria-describedby={errorId}
          className={cn(
            "w-full rounded-md border border-hairline bg-cream px-3 py-2 text-bark placeholder:text-jute/50",
            "transition-colors duration-200 ease-out",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jute focus-visible:ring-offset-2 focus-visible:ring-offset-parchment",
            "disabled:pointer-events-none disabled:opacity-50",
            error && "border-terracotta focus-visible:ring-terracotta",
            className,
          )}
          {...props}
        />
        {error && (
          <p id={errorId} role="alert" className="mt-1.5 text-sm text-terracotta">
            {error}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";
