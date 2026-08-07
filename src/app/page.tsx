import Image from "next/image";
import Link from "next/link";
import { Hand, Leaf, Recycle } from "lucide-react";
import { db } from "@/lib/db";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { ProductCard } from "@/components/shop/product-card";

// Same placeholder pool used in prisma/seed.ts — confirmed to resolve, but
// not jute-specific. Swap for real photography before this ships.
const STORY_IMAGE =
  "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1600&q=80";

const TRUST_ITEMS = [
  {
    icon: Leaf,
    title: "100% Natural Jute",
    description: "Biodegradable, renewable, and grown without irrigation.",
  },
  {
    icon: Hand,
    title: "Hand-Woven",
    description: "Every piece finished by a single artisan, start to finish.",
  },
  {
    icon: Recycle,
    title: "Built to Last",
    description: "Repairable, reusable, and meant for years of daily use.",
  },
];

export default async function HomePage() {
  const [featuredProducts, categories] = await Promise.all([
    db.product.findMany({
      where: { isFeatured: true, isActive: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    db.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <>
      <section className="relative flex min-h-[92vh] items-center justify-center bg-bark text-cream">
        <Container className="flex flex-col items-center text-center">
          <Reveal className="flex flex-col items-center">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-cream/70">
              Handwoven, One Fiber at a Time
            </p>
            <h1 className="mt-6 max-w-3xl font-serif text-5xl leading-tight sm:text-6xl md:text-7xl">
              The Quiet Craft of Jute
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-cream/80">
              Bags, baskets, and home goods made by artisans who have
              practiced this weave for generations — nothing rushed, nothing
              mass produced.
            </p>
            <Link
              href="/shop"
              className="mt-10 inline-flex h-14 items-center justify-center rounded-md bg-terracotta px-8 text-lg font-medium text-cream transition-colors duration-200 ease-out hover:bg-terracotta/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream focus-visible:ring-offset-2 focus-visible:ring-offset-bark"
            >
              Shop the Collection
            </Link>
          </Reveal>
        </Container>
      </section>

      {featuredProducts.length > 0 && (
        <section className="py-24">
          <Container>
            <Reveal>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-jute">
                This Season&rsquo;s Weave
              </p>
              <h2 className="mt-3 font-serif text-4xl text-bark">Featured Pieces</h2>
            </Reveal>
            <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 lg:grid-cols-4">
              {featuredProducts.map((product, index) => (
                <Reveal key={product.id} delay={index * 0.05}>
                  <ProductCard product={product} />
                </Reveal>
              ))}
            </div>
          </Container>
        </section>
      )}

      {categories.length > 0 && (
        <section className="bg-cream py-24">
          <Container>
            <Reveal>
              <h2 className="font-serif text-4xl text-bark">Shop by Category</h2>
            </Reveal>
            <div className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {categories.map((category, index) => (
                <Reveal key={category.id} delay={index * 0.05}>
                  <Link
                    href={`/shop?category=${category.slug}`}
                    className="group flex aspect-square flex-col items-center justify-center rounded-lg border border-hairline bg-parchment p-6 text-center transition-colors duration-200 ease-out hover:border-terracotta"
                  >
                    <span className="font-serif text-xl text-bark transition-colors duration-200 ease-out group-hover:text-terracotta">
                      {category.name}
                    </span>
                  </Link>
                </Reveal>
              ))}
            </div>
          </Container>
        </section>
      )}

      <section className="py-24">
        <Container className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <div className="relative aspect-4/3 overflow-hidden rounded-lg">
              <Image
                src={STORY_IMAGE}
                alt="An artisan's hands weaving jute fiber on a wooden loom"
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-jute">
              Our Story
            </p>
            <h2 className="mt-3 font-serif text-4xl text-bark">
              A Craft Passed Down, Not Mass Produced
            </h2>
            <p className="mt-6 text-jute">
              Every piece in this collection begins the same way it did
              generations ago — with raw jute fiber, a wooden loom, and a
              pair of hands that know the weave by feel, not by instruction.
              We work with a small collective of artisans in West Bengal,
              each specializing in a particular pattern: herringbone, twill,
              flat braid, basket weave.
            </p>
            <p className="mt-4 text-jute">
              Nothing here is produced at scale. When a weaver finishes a
              piece, it carries the particular tension of their hands that
              day — which is exactly why no two are ever quite identical.
            </p>
            <Link
              href="/our-story"
              className="mt-6 inline-block text-sm font-medium text-terracotta transition-colors duration-200 ease-out hover:opacity-70"
            >
              Read the full story →
            </Link>
          </Reveal>
        </Container>
      </section>

      <section className="border-t border-hairline bg-cream py-20">
        <Container className="grid gap-10 sm:grid-cols-3">
          {TRUST_ITEMS.map((item, index) => (
            <Reveal key={item.title} delay={index * 0.05}>
              <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
                <item.icon className="size-8 text-terracotta" aria-hidden="true" />
                <h3 className="mt-4 font-serif text-xl text-bark">{item.title}</h3>
                <p className="mt-2 text-sm text-jute">{item.description}</p>
              </div>
            </Reveal>
          ))}
        </Container>
      </section>
    </>
  );
}
