import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/money";

const LOW_STOCK_THRESHOLD = 3;

export interface ProductCardProduct {
  slug: string;
  title: string;
  priceCents: number;
  compareAtCents: number | null;
  stock: number;
  images: string[];
}

export function ProductCard({ product }: { product: ProductCardProduct }) {
  const isSoldOut = product.stock <= 0;
  const isLowStock = !isSoldOut && product.stock <= LOW_STOCK_THRESHOLD;
  const isOnSale = !isSoldOut && !!product.compareAtCents && product.compareAtCents > product.priceCents;

  return (
    <Link href={`/shop/${product.slug}`} className="group block">
      <Card className="overflow-hidden border-hairline">
        <div className="relative aspect-square overflow-hidden bg-jute/10">
          {product.images[0] && (
            <Image
              src={product.images[0]}
              alt={product.title}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
            />
          )}
          <div className="absolute left-3 top-3 flex flex-col gap-2">
            {isOnSale && <Badge variant="sale">Sale</Badge>}
            {isSoldOut && <Badge variant="sold-out">Sold Out</Badge>}
            {isLowStock && <Badge variant="low-stock">Only {product.stock} left</Badge>}
          </div>
        </div>
      </Card>
      <div className="mt-3 space-y-1">
        <h3 className="font-serif text-lg text-bark">{product.title}</h3>
        <p className="text-sm">
          <span className={isOnSale ? "text-terracotta" : "text-bark"}>
            {formatPrice(product.priceCents)}
          </span>
          {isOnSale && product.compareAtCents && (
            <span className="ml-2 text-jute line-through">
              {formatPrice(product.compareAtCents)}
            </span>
          )}
        </p>
      </div>
    </Link>
  );
}
