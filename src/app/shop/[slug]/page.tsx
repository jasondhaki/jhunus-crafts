import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getProductBySlug } from "@/lib/product-query";
import { Container } from "@/components/ui/container";
import { ProductGallery } from "@/components/shop/product-gallery";
import { StarRating } from "@/components/shop/star-rating";
import { ProductSpecs } from "@/components/shop/product-specs";
import { AddToCart } from "@/components/shop/add-to-cart";
import { InfoAccordion } from "@/components/shop/info-accordion";
import { ReviewsSection } from "@/components/shop/reviews-section";
import { RelatedProducts } from "@/components/shop/related-products";
import { formatPrice, fromCents } from "@/lib/money";
import { toJsonLd } from "@/lib/json-ld";
import { SITE_NAME, SITE_URL } from "@/lib/site-config";

const LOW_STOCK_THRESHOLD = 3;

// Stock/price on this page can lag reality by up to an hour — acceptable
// because the authoritative check happens server-side at checkout (per
// CLAUDE.md rule 3), not here. ISR falls back to on-demand rendering for
// any slug not covered by generateStaticParams.
export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const products = await db.product.findMany({
      where: { isActive: true },
      select: { slug: true },
    });
    return products.map((product) => ({ slug: product.slug }));
  } catch (error) {
    // If the DB is unreachable at build time (CI builds with a dummy,
    // unreachable DATABASE_URL), fall back to generating nothing
    // statically rather than failing the whole build — pages then render
    // on-demand at request time instead, same as sitemap.ts's fix.
    console.warn(
      "generateStaticParams: could not reach the database, skipping static generation for /shop/[slug]",
      error,
    );
    return [];
  }
}

export async function generateMetadata({
  params,
}: PageProps<"/shop/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product || !product.isActive) {
    return {};
  }

  const description =
    product.description.length > 160
      ? `${product.description.slice(0, 157)}...`
      : product.description;

  return {
    title: product.title,
    description,
    alternates: {
      canonical: `/shop/${product.slug}`,
    },
    openGraph: {
      title: product.title,
      description,
      images: product.images,
      type: "website",
    },
  };
}

export default async function ProductPage({ params }: PageProps<"/shop/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product || !product.isActive) {
    notFound();
  }

  const reviewCount = product.reviews.length;
  const averageRating =
    reviewCount > 0
      ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount
      : 0;
  const isSoldOut = product.stock <= 0;
  const isLowStock = !isSoldOut && product.stock <= LOW_STOCK_THRESHOLD;
  const isOnSale =
    !isSoldOut && !!product.compareAtCents && product.compareAtCents > product.priceCents;

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    image: product.images,
    description: product.description,
    // No dedicated SKU field on Product — the slug is already a stable,
    // public-facing identifier, so it stands in for one here.
    sku: product.slug,
    brand: {
      "@type": "Brand",
      name: SITE_NAME,
    },
    offers: {
      "@type": "Offer",
      price: fromCents(product.priceCents).toFixed(2),
      priceCurrency: "USD",
      availability: isSoldOut ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      url: `${SITE_URL}/shop/${product.slug}`,
    },
    // Never fabricate a rating — Google penalizes structured data that
    // doesn't match what's actually visible on the page.
    ...(reviewCount > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: averageRating.toFixed(1),
        reviewCount,
      },
    }),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Shop", item: `${SITE_URL}/shop` },
      {
        "@type": "ListItem",
        position: 3,
        name: product.category.name,
        item: `${SITE_URL}/shop?category=${product.category.slug}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: product.title,
        item: `${SITE_URL}/shop/${product.slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(breadcrumbJsonLd) }}
      />

      <Container className="py-16">
        <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-2 text-sm text-jute">
          <Link href="/" className="transition-colors duration-200 ease-out hover:text-terracotta">
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <Link
            href="/shop"
            className="transition-colors duration-200 ease-out hover:text-terracotta"
          >
            Shop
          </Link>
          <span aria-hidden="true">/</span>
          <Link
            href={`/shop?category=${product.category.slug}`}
            className="transition-colors duration-200 ease-out hover:text-terracotta"
          >
            {product.category.name}
          </Link>
        </nav>

        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <ProductGallery images={product.images} title={product.title} />

          <div>
            <Link
              href={`/shop?category=${product.category.slug}`}
              className="text-sm font-medium uppercase tracking-[0.2em] text-jute transition-colors duration-200 ease-out hover:text-terracotta"
            >
              {product.category.name}
            </Link>
            <h1 className="mt-2 font-serif text-4xl text-bark">{product.title}</h1>

            <p className="mt-4 text-2xl">
              <span className={isOnSale ? "text-terracotta" : "text-bark"}>
                {formatPrice(product.priceCents)}
              </span>
              {isOnSale && product.compareAtCents && (
                <span className="ml-3 text-lg text-jute line-through">
                  {formatPrice(product.compareAtCents)}
                </span>
              )}
            </p>

            <a
              href="#reviews"
              className="mt-3 inline-flex items-center gap-2 text-sm text-jute transition-colors duration-200 ease-out hover:text-terracotta"
            >
              {reviewCount > 0 ? (
                <>
                  <StarRating rating={averageRating} />
                  <span>
                    {averageRating.toFixed(1)} ({reviewCount} review{reviewCount === 1 ? "" : "s"})
                  </span>
                </>
              ) : (
                <span>Be the first to review this piece</span>
              )}
            </a>

            <p className="mt-6 text-jute">{product.description}</p>

            <div className="mt-8">
              <ProductSpecs
                dimensions={product.dimensions}
                materials={product.materials}
                weave={product.weave}
                color={product.color}
              />
            </div>

            <p className="mt-4 text-sm">
              {isSoldOut ? (
                <span className="font-medium text-jute">Currently sold out</span>
              ) : isLowStock ? (
                <span className="font-medium text-terracotta">
                  Only {product.stock} left in stock
                </span>
              ) : (
                <span className="font-medium text-jute">In stock and ready to ship</span>
              )}
            </p>

            <div className="mt-6">
              <AddToCart stock={product.stock} />
            </div>

            <div className="mt-10">
              <InfoAccordion weave={product.weave} />
            </div>
          </div>
        </div>

        <ReviewsSection reviews={product.reviews} />
        <RelatedProducts categoryId={product.categoryId} excludeProductId={product.id} />
      </Container>
    </>
  );
}
