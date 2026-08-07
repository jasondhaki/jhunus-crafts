import { Suspense } from "react";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { Container } from "@/components/ui/container";
import { FilterSidebar } from "@/components/shop/filter-sidebar";
import { ActiveFilterChips } from "@/components/shop/active-filter-chips";
import { ProductGrid } from "@/components/shop/product-grid";
import { ProductGridSkeleton } from "@/components/shop/product-grid-skeleton";
import { parseShopSearchParams } from "@/lib/shop-search-params";
import { buildShopUrl } from "@/lib/shop-url";

export async function generateMetadata({
  searchParams,
}: PageProps<"/shop">): Promise<Metadata> {
  const raw = await searchParams;
  const params = parseShopSearchParams(raw);

  let title = "Shop All";
  let description =
    "Hand-woven jute bags, baskets, and home goods — browse the full collection.";

  if (params.category.length === 1) {
    const category = await db.category.findUnique({ where: { slug: params.category[0] } });
    if (category) {
      title = category.name;
      description = category.description ?? description;
    }
  }

  return {
    title,
    description,
    alternates: {
      // Canonical intentionally omits `page` — every page of a given
      // filter set is the same logical listing for search engines.
      canonical: buildShopUrl(params),
    },
  };
}

export default async function ShopPage({ searchParams }: PageProps<"/shop">) {
  const raw = await searchParams;
  const params = parseShopSearchParams(raw);

  const [categories, weaveRows] = await Promise.all([
    db.category.findMany({ orderBy: { name: "asc" } }),
    db.product.findMany({
      where: { isActive: true, weave: { not: null } },
      select: { weave: true },
      distinct: ["weave"],
      orderBy: { weave: "asc" },
    }),
  ]);

  const weaves = weaveRows
    .map((row) => row.weave)
    .filter((weave): weave is string => weave !== null);

  const suspenseKey = JSON.stringify(params);

  return (
    <Container className="py-16">
      <div className="mb-10">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-jute">Shop</p>
        <h1 className="mt-2 font-serif text-4xl text-bark">The Full Collection</h1>
      </div>

      <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-12">
        <FilterSidebar categories={categories} weaves={weaves} />

        <div>
          <div className="mb-6">
            <ActiveFilterChips categories={categories} />
          </div>

          <Suspense key={suspenseKey} fallback={<ProductGridSkeleton />}>
            <ProductGrid params={params} />
          </Suspense>
        </div>
      </div>
    </Container>
  );
}
