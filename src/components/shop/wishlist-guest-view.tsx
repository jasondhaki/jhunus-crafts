"use client";

import { useEffect, useState, useTransition } from "react";
import { useWishlistHasHydrated, useWishlistStore } from "@/store/wishlist";
import { getWishlistProducts, type WishlistProduct } from "@/actions/wishlist";
import { WishlistTile } from "@/components/shop/wishlist-tile";
import { WishlistEmptyState } from "@/components/shop/wishlist-empty-state";
import { Skeleton } from "@/components/ui/skeleton";

export function WishlistGuestView() {
  const productIds = useWishlistStore((state) => state.productIds);
  const removeFromStore = useWishlistStore((state) => state.remove);
  const hasHydrated = useWishlistHasHydrated();
  const [products, setProducts] = useState<WishlistProduct[] | null>(null);
  const [isPending, startTransition] = useTransition();

  const idsKey = productIds.join(",");

  useEffect(() => {
    if (!hasHydrated) return;
    startTransition(async () => {
      const result = await getWishlistProducts(productIds);
      setProducts(result);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated, idsKey]);

  function handleRemove(productId: string) {
    removeFromStore(productId);
    setProducts((current) => current?.filter((product) => product.productId !== productId) ?? current);
  }

  if (!hasHydrated || (isPending && products === null)) {
    return (
      <div className="grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-3">
            <Skeleton className="aspect-square w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
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
