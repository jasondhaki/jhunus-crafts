"use client";

import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, X, XCircle } from "lucide-react";
import { useToastStore } from "@/store/toast";

const AUTO_DISMISS_MS = 5000;

export function ToastHost() {
  const toasts = useToastStore((state) => state.toasts);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-4 sm:items-end"
      aria-live="polite"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} id={toast.id} type={toast.type} message={toast.message} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ id, type, message }: { id: string; type: "success" | "error"; message: string }) {
  const dismiss = useToastStore((state) => state.dismiss);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const timer = setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [id, dismiss]);

  return (
    <motion.div
      role="status"
      layout
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.96 }}
      animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
      transition={{ duration: shouldReduceMotion ? 0.15 : 0.25, ease: "easeOut" }}
      className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-md border bg-bark p-4 text-sm text-cream shadow-lg"
      style={{ borderColor: type === "success" ? "rgb(140 109 70 / 0.4)" : "rgb(163 90 56 / 0.6)" }}
    >
      {type === "success" ? (
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-jute" aria-hidden="true" />
      ) : (
        <XCircle className="mt-0.5 size-5 shrink-0 text-terracotta" aria-hidden="true" />
      )}
      <p className="flex-1">{message}</p>
      <button
        type="button"
        onClick={() => dismiss(id)}
        aria-label="Dismiss notification"
        className="shrink-0 text-cream/60 transition-colors duration-200 ease-out hover:text-cream"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </motion.div>
  );
}
