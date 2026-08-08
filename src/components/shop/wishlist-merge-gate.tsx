"use client";

import { useEffect, useRef } from "react";
import { useWishlistHasHydrated, useWishlistStore } from "@/store/wishlist";
import { mergeGuestWishlist } from "@/actions/wishlist";

// Survives full page reloads within the same browser tab so a signed-in
// user who refreshes doesn't re-run the merge every time.
const MERGE_FLAG_KEY = "jhunu-wishlist-merged";

/**
 * Renders nothing — mounted once in the root layout to merge a guest's
 * cookie-held wishlist into the database exactly once per session right
 * after sign-in, then clears the local store.
 *
 * Two layers guard against a re-run: `hasMergedRef` covers re-renders while
 * this component stays mounted (it's set to true *before* the async merge
 * call, not after, so a re-render mid-flight can't re-enter it), and
 * sessionStorage covers a full page reload later in the same tab/session.
 */
export function WishlistMergeGate({ isAuthenticated }: { isAuthenticated: boolean }) {
  const productIds = useWishlistStore((state) => state.productIds);
  const clear = useWishlistStore((state) => state.clear);
  const hasHydrated = useWishlistHasHydrated();
  const hasMergedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !hasHydrated || hasMergedRef.current) return;
    if (window.sessionStorage.getItem(MERGE_FLAG_KEY)) {
      hasMergedRef.current = true;
      return;
    }

    hasMergedRef.current = true;
    window.sessionStorage.setItem(MERGE_FLAG_KEY, "1");

    if (productIds.length === 0) return;

    void mergeGuestWishlist(productIds).then(() => clear());
  }, [isAuthenticated, hasHydrated, productIds, clear]);

  return null;
}
