"use client";

import { useEffect, useRef } from "react";
import { useToastStore } from "@/store/toast";

interface ToastableActionState {
  success: boolean;
  message?: string;
}

/**
 * Fires a toast whenever a useActionState result changes — but never on
 * mount. useActionState's returned state object is a new reference after
 * every submission, including the very first render (where it's just the
 * initial state), so without the first-render guard this would toast
 * immediately on every page load.
 */
export function useActionToast(state: ToastableActionState): void {
  const push = useToastStore((toastState) => toastState.push);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (state.message) {
      push(state.success ? "success" : "error", state.message);
    }
  }, [state, push]);
}
