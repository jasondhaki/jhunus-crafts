import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/money";
import { shimmerDataUrl } from "@/lib/blur-placeholder";

const LOW_STOCK_THRESHOLD = 3;
const BLUR_DATA_URL = shimmerDataUrl(600, 600);
const IMAGE_SIZES = "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw";

export interface ProductCardProduct {
  slug: string;
  title: string;
  priceCents: number;
  compareAtCents: number | null;
  stock: number;
  images: string[];
}

export function ProductCard({
  product,
  priority = false,
}: {
  product: ProductCardProduct;
  // Set by the grid for whichever cards land above the fold on first
  // paint — found via a real (not simulated) LCP warning in dev server
  // logs while running the E2E suite: every ProductCard image was
  // lazy-loaded by default, including whichever one the browser actually
  // picked as the page's Largest Contentful Paint element.
  priority?: boolean;
}) {
  const isSoldOut = product.stock <= 0;
  const isLowStock = !isSoldOut && product.stock <= LOW_STOCK_THRESHOLD;
  const isOnSale = !isSoldOut && !!product.compareAtCents && product.compareAtCents > product.priceCents;
  const [primaryImage, secondaryImage] = product.images;

  return (
    <Link href={`/shop/${product.slug}`} className="group block">
      <Card
        className={
          "overflow-hidden border-hairline transition-transform duration-300 ease-out group-hover:-translate-y-1"
        }
      >
        <div className="relative aspect-square overflow-hidden bg-jute/10">
          {primaryImage && (
            <Image
              src={primaryImage}
              alt={product.title}
              fill
              sizes={IMAGE_SIZES}
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
              priority={priority}
              // As of Next 16, `priority` alone no longer sets
              // fetchpriority="high" on the rendered <img> (deprecated in
              // favor of `preload`/`fetchPriority` — see
              // product-gallery.tsx for the full story). undefined here
              // (not "low"/"auto") lets the browser's own default apply
              // to non-prioritized cards.
              fetchPriority={priority ? "high" : undefined}
              className={
                "object-cover transition-opacity duration-300 ease-out" +
                (secondaryImage ? " group-hover:opacity-0" : "")
              }
            />
          )}
          {secondaryImage && (
            <Image
              src={secondaryImage}
              alt=""
              aria-hidden="true"
              fill
              sizes={IMAGE_SIZES}
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
              className="object-cover opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100"
            />
          )}

          {isSoldOut && (
            <div className="absolute inset-0 flex items-center justify-center bg-bark/50">
              <span className="text-sm font-semibold uppercase tracking-wide text-cream">
                Sold Out
              </span>
            </div>
          )}

          <div className="absolute left-3 top-3 flex flex-col gap-2">
            {isOnSale && <Badge variant="sale">Sale</Badge>}
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
