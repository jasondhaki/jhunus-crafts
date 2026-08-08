"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWishlistHasHydrated, useWishlistStore } from "@/store/wishlist";
import { addWishlistItem, removeWishlistItem } from "@/actions/wishlist";

export function WishlistButton({
  productId,
  isAuthenticated,
  initialWishlisted = false,
}: {
  productId: string;
  isAuthenticated: boolean;
  initialWishlisted?: boolean;
}) {
  const guestIds = useWishlistStore((state) => state.productIds);
  const toggleGuest = useWishlistStore((state) => state.toggle);
  const hasHydrated = useWishlistHasHydrated();
  const [authedWishlisted, setAuthedWishlisted] = useState(initialWishlisted);
  const [isPending, startTransition] = useTransition();

  const isWishlisted = isAuthenticated
    ? authedWishlisted
    : hasHydrated && guestIds.includes(productId);

  function handleToggle() {
    if (isAuthenticated) {
      const next = !authedWishlisted;
      setAuthedWishlisted(next);
      startTransition(async () => {
        try {
          if (next) {
            await addWishlistItem(productId);
          } else {
            await removeWishlistItem(productId);
          }
        } catch (error) {
          setAuthedWishlisted(!next);
          console.error("wishlist toggle failed", error);
        }
      });
      return;
    }

    toggleGuest(productId);
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      aria-pressed={isWishlisted}
      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
      className={cn(
        "inline-flex size-14 shrink-0 items-center justify-center rounded-md border border-hairline text-bark transition-colors duration-200 ease-out hover:border-terracotta hover:text-terracotta disabled:pointer-events-none disabled:opacity-60",
        isWishlisted && "border-terracotta text-terracotta",
      )}
    >
      <Heart className={cn("size-5", isWishlisted && "fill-current")} aria-hidden="true" />
    </button>
  );
}
