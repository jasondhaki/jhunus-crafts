import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { SITE_URL as BASE_URL } from "@/lib/site-config";

// Without this, Next tries to statically prerender the sitemap at build
// time — which means it needs a live DB connection during `next build`.
// CI builds with dummy, unreachable DB credentials, so this must render
// at request time instead.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([
    db.product.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    }),
    db.category.findMany({ select: { slug: true } }),
  ]);

  return [
    { url: BASE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/shop`, changeFrequency: "daily", priority: 0.9 },
    ...categories.map((category) => ({
      url: `${BASE_URL}/shop?category=${category.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...products.map((product) => ({
      url: `${BASE_URL}/shop/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
