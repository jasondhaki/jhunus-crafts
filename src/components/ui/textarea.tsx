import { forwardRef, useId, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, id, rows = 4, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id ?? generatedId;
    const errorId = error ? `${textareaId}-error` : undefined;

    return (
      <div className="w-full">
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          aria-invalid={!!error || undefined}
          aria-describedby={errorId}
          className={cn(
            "w-full resize-y rounded-md border border-hairline bg-cream px-3 py-2 text-bark placeholder:text-jute/50",
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
Textarea.displayName = "Textarea";
