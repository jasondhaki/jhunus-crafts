"use client";

import { useState, useTransition } from "react";
import { WishlistTile } from "@/components/shop/wishlist-tile";
import { WishlistEmptyState } from "@/components/shop/wishlist-empty-state";
import { removeWishlistItem, type WishlistProduct } from "@/actions/wishlist";

export function WishlistAuthedView({ initialProducts }: { initialProducts: WishlistProduct[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [, startTransition] = useTransition();

  function handleRemove(productId: string) {
    setProducts((current) => current.filter((product) => product.productId !== productId));
    startTransition(async () => {
      try {
        await removeWishlistItem(productId);
      } catch (error) {
        // Non-critical: worst case the item reappears on next visit. Log
        // rather than silently swallow (CLAUDE.md rule 9).
        console.error("removeWishlistItem failed", error);
      }
    });
  }

  if (products.length === 0) {
    return <WishlistEmptyState />;
  }

  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <WishlistTile key={product.productId} product={product} onRemove={handleRemove} />
      ))}
    </div>
  );
}
