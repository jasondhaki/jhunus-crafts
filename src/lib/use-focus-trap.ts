"use client";

import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Traps Tab/Shift+Tab within `containerRef` while `isActive`, moves focus
 * into the container on activation, and restores it to whatever was
 * focused beforehand on deactivation — the standard WAI-ARIA dialog
 * pattern. Written by hand (no new dependency) since this is a small,
 * well-defined behavior.
 *
 * Found missing entirely on the cart drawer during the accessibility pass:
 * a role="dialog" with no focus management at all means Tab can walk
 * straight through into the page behind it (visually hidden under the
 * backdrop, but not actually removed from the tab order), and closing the
 * drawer left focus wherever it happened to be rather than back on
 * whatever opened it.
 */
export function useFocusTrap(containerRef: RefObject<HTMLElement | null>, isActive: boolean): void {
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive) return;

    const container = containerRef.current;
    if (!container) return;

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

    function getFocusable(): HTMLElement[] {
      return Array.from(container!.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    }

    // Moves focus in on the next frame — the container/its contents may
    // still be animating in (Framer Motion), so querying immediately can
    // catch elements before they're stably focusable.
    const focusFirst = window.requestAnimationFrame(() => {
      getFocusable()[0]?.focus();
    });

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Tab") return;
      const items = getFocusable();
      if (items.length === 0) return;

      const first = items[0]!;
      const last = items[items.length - 1]!;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    container.addEventListener("keydown", onKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFirst);
      container.removeEventListener("keydown", onKeyDown);
      previouslyFocusedRef.current?.focus();
    };
  }, [isActive, containerRef]);
}
