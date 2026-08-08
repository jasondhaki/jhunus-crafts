"use client";

import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/money";
import { Button } from "@/components/ui/button";
import type { WishlistProduct } from "@/actions/wishlist";

export function WishlistItemCard({
  product,
  isPending,
  onMoveToCart,
  onRemove,
}: {
  product: WishlistProduct;
  isPending: boolean;
  onMoveToCart: (productId: string) => void;
  onRemove: (productId: string) => void;
}) {
  const isSoldOut = product.stock <= 0;
  const isOnSale = !!product.compareAtCents && product.compareAtCents > product.priceCents;

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-hairline bg-cream">
      <Link href={`/shop/${product.slug}`} className="relative block aspect-square bg-jute/10">
        {product.images[0] && (
          <Image
            src={product.images[0]}
            alt={product.title}
            fill
            sizes="(min-width: 1024px) 25vw, 50vw"
            className="object-cover"
          />
        )}
        {isSoldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-bark/50">
            <span className="text-sm font-semibold uppercase tracking-wide text-cream">Sold Out</span>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link
          href={`/shop/${product.slug}`}
          className="font-serif text-lg text-bark transition-colors duration-200 ease-out hover:text-terracotta"
        >
          {product.title}
        </Link>
        <p className="mt-1 text-sm">
          <span className={isOnSale ? "text-terracotta" : "text-bark"}>
            {formatPrice(product.priceCents)}
          </span>
          {isOnSale && product.compareAtCents && (
            <span className="ml-2 text-jute line-through">{formatPrice(product.compareAtCents)}</span>
          )}
        </p>

        <div className="mt-auto flex gap-2 pt-4">
          <Button
            type="button"
            size="sm"
            className="flex-1"
            disabled={isSoldOut || isPending}
            onClick={() => onMoveToCart(product.productId)}
          >
            {isSoldOut ? "Sold Out" : "Move to Cart"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={isPending}
            onClick={() => onRemove(product.productId)}
          >
            Remove
          </Button>
        </div>
      </div>
    </div>
  );
}
