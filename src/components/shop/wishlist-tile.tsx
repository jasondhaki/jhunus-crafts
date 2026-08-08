"use client";

import { Heart } from "lucide-react";
import { ProductCard, type ProductCardProduct } from "@/components/shop/product-card";

export function WishlistTile({
  product,
  onRemove,
}: {
  product: ProductCardProduct & { productId: string };
  onRemove: (productId: string) => void;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => onRemove(product.productId)}
        aria-label={`Remove ${product.title} from wishlist`}
        className="absolute right-3 top-3 z-10 inline-flex size-9 items-center justify-center rounded-full bg-cream/90 text-terracotta shadow-sm transition-colors duration-200 ease-out hover:bg-cream"
      >
        <Heart className="size-4 fill-current" aria-hidden="true" />
      </button>
      <ProductCard product={product} />
    </div>
  );
}
