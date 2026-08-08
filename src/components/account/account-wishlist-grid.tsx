"use client";

import { useState, useTransition } from "react";
import { useCartStore } from "@/store/cart";
import { removeWishlistItem, type WishlistProduct } from "@/actions/wishlist";
import { WishlistItemCard } from "@/components/account/wishlist-item-card";
import { WishlistEmptyState } from "@/components/shop/wishlist-empty-state";

export function AccountWishlistGrid({ initialProducts }: { initialProducts: WishlistProduct[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [isPending, startTransition] = useTransition();
  const addItem = useCartStore((state) => state.addItem);
  const openCart = useCartStore((state) => state.open);

  function removeFromList(productId: string) {
    setProducts((current) => current.filter((product) => product.productId !== productId));
  }

  function handleMoveToCart(productId: string) {
    addItem(productId, 1);
    openCart();
    removeFromList(productId);
    startTransition(async () => {
      try {
        await removeWishlistItem(productId);
      } catch (error) {
        // Non-critical: worst case the item reappears in the wishlist on
        // next visit — the cart add itself already succeeded.
        console.error("removeWishlistItem failed after move-to-cart", error);
      }
    });
  }

  function handleRemove(productId: string) {
    removeFromList(productId);
    startTransition(async () => {
      try {
        await removeWishlistItem(productId);
      } catch (error) {
        console.error("removeWishlistItem failed", error);
      }
    });
  }

  if (products.length === 0) {
    return <WishlistEmptyState />;
  }

  return (
    <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <WishlistItemCard
          key={product.productId}
          product={product}
          isPending={isPending}
          onMoveToCart={handleMoveToCart}
          onRemove={handleRemove}
        />
      ))}
    </div>
  );
}
