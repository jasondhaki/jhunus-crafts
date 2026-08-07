import bcrypt from "bcryptjs";
import { db } from "../src/lib/db";

// Placeholder photography only — confirmed to resolve (HTTP 200) but not
// necessarily jute-specific. Swap for real Cloudinary-hosted product
// photography before this ships anything customer-facing.
const PLACEHOLDER_IMAGES = [
  "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=1200&q=80",
] as const;

function imagesFor(...indexes: number[]): string[] {
  return indexes.map((i) => PLACEHOLDER_IMAGES[i % PLACEHOLDER_IMAGES.length]);
}

const CATEGORIES = [
  {
    name: "Tote Bags",
    slug: "tote-bags",
    description:
      "Hand-woven jute totes for market runs, beach days, and everyday carry.",
  },
  {
    name: "Storage Baskets",
    slug: "storage-baskets",
    description:
      "Sturdy woven baskets that bring order to any room, one fiber at a time.",
  },
  {
    name: "Home Decor",
    slug: "home-decor",
    description:
      "Textural jute pieces that bring warmth and craft into a living space.",
  },
  {
    name: "Accessories",
    slug: "accessories",
    description: "Small woven goods — pouches, slings, and coasters.",
  },
] as const;

type SeedProduct = {
  title: string;
  slug: string;
  description: string;
  priceCents: number;
  compareAtCents?: number;
  stock: number;
  images: string[];
  dimensions: string;
  weave: "Herringbone" | "Flat Braid" | "Twill" | "Basket Weave";
  color: string;
  isFeatured: boolean;
  categorySlug: (typeof CATEGORIES)[number]["slug"];
};

const PRODUCTS: SeedProduct[] = [
  {
    title: "Heirloom Herringbone Market Tote",
    slug: "heirloom-herringbone-market-tote",
    description:
      "Woven by hand in a tight herringbone pattern, this tote is built for the daily walk to market and back. The natural jute fibers are sourced from the Ganges delta and spun by artisans who have practiced the craft for three generations. Reinforced double-stitched handles carry produce, books, or a change of plans without complaint. Every tote carries small irregularities in the weave — proof of the hand that made it, not a flaw to correct. It softens with use and only grows more comfortable over years of carrying your life around.",
    priceCents: 4800,
    stock: 14,
    images: imagesFor(0, 2),
    dimensions: '16" W x 14" H x 5" D',
    weave: "Herringbone",
    color: "Natural",
    isFeatured: true,
    categorySlug: "tote-bags",
  },
  {
    title: "Sundrift Flat-Braid Beach Tote",
    slug: "sundrift-flat-braid-beach-tote",
    description:
      "A wide, flat-braided weave gives this tote an open, breathable structure — sand falls straight through instead of settling in the corners. The oversized silhouette swallows towels, a paperback, and a wide-brimmed hat without a fight over zippers. Dyed in small batches with a soft terracotta wash that fades gracefully with sun and salt water. The rope handles are long enough to sling over a shoulder and forget about until you're unpacking it on the sand. A warm-weather companion meant to be used hard and often.",
    priceCents: 5600,
    compareAtCents: 6800,
    stock: 22,
    images: imagesFor(1, 3),
    dimensions: '18" W x 15" H x 6" D',
    weave: "Flat Braid",
    color: "Terracotta",
    isFeatured: false,
    categorySlug: "tote-bags",
  },
  {
    title: "Wanderer's Twill Work Tote",
    slug: "wanderers-twill-work-tote",
    description:
      "Twill-woven for extra density, this is the heaviest-duty tote in the collection — built to haul tools, firewood, or a farmers-market haul without sagging. Only one weaver in the collective still ties this particular twill pattern, which is why we can offer so few at a time. A wide flat base lets it stand upright when loaded, and the undyed jute darkens beautifully with handling. Once this run sells out, it will be some time before another is finished by hand.",
    priceCents: 6400,
    stock: 1,
    images: imagesFor(2, 4),
    dimensions: '17" W x 16" H x 7" D',
    weave: "Twill",
    color: "Espresso",
    isFeatured: true,
    categorySlug: "tote-bags",
  },
  {
    title: "Basket Weave Nesting Trio",
    slug: "basket-weave-nesting-trio",
    description:
      "Three baskets, one weave, endlessly useful. Woven in a classic over-under basket pattern and finished with a rolled rim that won't fray, this nesting set moves from pantry to bathroom to closet without ever looking out of place. The largest holds a full laundry load; the smallest is just right for hair ties and loose change. Stack them empty to save shelf space, or fill all three and let them do the tidying for you. A quietly practical set that earns its keep.",
    priceCents: 5200,
    stock: 9,
    images: imagesFor(3, 5),
    dimensions: 'Set of 3: 14", 11", 8" diameter',
    weave: "Basket Weave",
    color: "Sand",
    isFeatured: false,
    categorySlug: "storage-baskets",
  },
  {
    title: "Round Herringbone Storage Bin",
    slug: "round-herringbone-storage-bin",
    description:
      "A deep, round bin woven in the same herringbone pattern as our totes, scaled up for blankets, toys, or firewood. The structured sides hold their shape even fully loaded, and the reinforced base resists sagging over years of use. Two woven handles make it easy to move room to room without straining the rim. This is the piece customers reorder for every room in the house — right now, more are on the loom than in stock.",
    priceCents: 5800,
    stock: 0,
    images: imagesFor(4, 0),
    dimensions: '20" diameter x 16" H',
    weave: "Herringbone",
    color: "Charcoal",
    isFeatured: false,
    categorySlug: "storage-baskets",
  },
  {
    title: "Lidded Twill Laundry Hamper",
    slug: "lidded-twill-laundry-hamper",
    description:
      "A twill-woven hamper dense enough to keep its shape empty or full, topped with a fitted lid that hides the week's laundry without sealing in odor — jute breathes where plastic can't. The interior is left undyed and untreated, so it's safe for delicates and linens alike. Sturdy rope handles on both sides make it easy to carry to the machine and back. Built to stand in a corner for years, not months.",
    priceCents: 7200,
    compareAtCents: 8400,
    stock: 6,
    images: imagesFor(5, 1),
    dimensions: '15" diameter x 22" H',
    weave: "Twill",
    color: "Moss",
    isFeatured: false,
    categorySlug: "storage-baskets",
  },
  {
    title: "Chunky Flat-Braid Floor Pouf",
    slug: "chunky-flat-braid-floor-pouf",
    description:
      "Thick ropes of jute are flat-braided and coiled into a low, sturdy pouf that doubles as extra seating or a footrest by the window. The oversized braid gives it a sculptural, almost architectural presence — this is a piece meant to be seen, not tucked away. Densely stuffed with natural fiber offcuts from our own workshop, so nothing goes to waste in the making of it. Sits flush to the floor and holds its shape under regular use.",
    priceCents: 9600,
    stock: 4,
    images: imagesFor(0, 4),
    dimensions: '20" diameter x 12" H',
    weave: "Flat Braid",
    color: "Rust",
    isFeatured: false,
    categorySlug: "home-decor",
  },
  {
    title: "Basket Weave Wall Hanging",
    slug: "basket-weave-wall-hanging",
    description:
      "A flat panel woven in an intricate basket-weave lattice, stretched over a hidden wooden frame and finished with a fringed lower edge. Hung above a bed or a console table, it brings the same warmth as a textile without the weight — the open weave lets light pass through and cast soft shadows across the wall behind it. Each panel is woven as a single continuous piece, so no two are ever quite identical.",
    priceCents: 8800,
    stock: 11,
    images: imagesFor(1, 5),
    dimensions: '30" W x 40" H',
    weave: "Basket Weave",
    color: "Ivory",
    isFeatured: true,
    categorySlug: "home-decor",
  },
  {
    title: "Twill-Wrapped Table Runner",
    slug: "twill-wrapped-table-runner",
    description:
      "A narrow twill weave brings texture to the table without overwhelming it — this runner sits comfortably under stoneware, candles, or a simple centerpiece. The tight weave resists fraying at the edges even after repeated washing and folding. Undyed and left in its natural tone, it pairs easily with nearly any table setting, and softens in hand the more it's used. A small, quiet way to bring the workshop's craft into a daily ritual.",
    priceCents: 3400,
    compareAtCents: 4200,
    stock: 17,
    images: imagesFor(2, 0),
    dimensions: '14" W x 72" L',
    weave: "Twill",
    color: "Walnut",
    isFeatured: false,
    categorySlug: "home-decor",
  },
  {
    title: "Flat-Braid Coin Pouch",
    slug: "flat-braid-coin-pouch",
    description:
      "A small flat-braided pouch sized for coins, cards, or a folded bill or two, closed with a simple wooden toggle. Woven from the same jute rope as our larger totes, scaled down to fit in a pocket. A favorite small gift and an easy way to try the weave before committing to a full-size bag. Each one is finished by hand, so the exact braid pattern varies slightly from pouch to pouch.",
    priceCents: 1400,
    stock: 35,
    images: imagesFor(3, 2),
    dimensions: '5" W x 4" H',
    weave: "Flat Braid",
    color: "Clay",
    isFeatured: false,
    categorySlug: "accessories",
  },
  {
    title: "Herringbone Phone Sling",
    slug: "herringbone-phone-sling",
    description:
      "A slim crossbody sling woven in a fine herringbone pattern, sized to carry a phone, a card or two, and little else — for the days you want to walk out the door with nothing to think about. The adjustable jute cord strap sits comfortably across the body, and the open top makes reaching your phone a one-handed motion. Undyed and understated, it's meant to disappear into an outfit rather than announce itself.",
    priceCents: 2200,
    stock: 28,
    images: imagesFor(4, 3),
    dimensions: '5" W x 7" H',
    weave: "Herringbone",
    color: "Bone",
    isFeatured: false,
    categorySlug: "accessories",
  },
  {
    title: "Basket Weave Coaster Set",
    slug: "basket-weave-coaster-set",
    description:
      "Four coasters woven in a tight basket pattern and pressed flat, thick enough to protect a table from condensation without feeling bulky underhand. Trimmed with a whip-stitched edge that keeps the weave from unraveling through years of daily use. Stack them in the included jute loop when not in use, or set out separately for a table full of guests. A small, functional taste of the workshop's craft for a kitchen table or a coffee table alike.",
    priceCents: 1800,
    stock: 40,
    images: imagesFor(5, 4),
    dimensions: 'Set of 4: 4" diameter',
    weave: "Basket Weave",
    color: "Sage",
    isFeatured: false,
    categorySlug: "accessories",
  },
];

const ADMIN_EMAIL = "admin@jhunuscrafts.com";
const ADMIN_PASSWORD = "Admin123!Jute";
const CUSTOMER_EMAIL = "customer@example.com";
const CUSTOMER_PASSWORD = "Customer123!Jute";

async function seedCategories() {
  const categoryIdBySlug = new Map<string, string>();

  for (const category of CATEGORIES) {
    const record = await db.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });
    categoryIdBySlug.set(category.slug, record.id);
  }

  return categoryIdBySlug;
}

async function seedProducts(categoryIdBySlug: Map<string, string>) {
  for (const { categorySlug, ...product } of PRODUCTS) {
    const categoryId = categoryIdBySlug.get(categorySlug);
    if (!categoryId) {
      throw new Error(`Unknown category slug "${categorySlug}" for product "${product.slug}"`);
    }

    await db.product.upsert({
      where: { slug: product.slug },
      update: { ...product, categoryId },
      create: { ...product, categoryId },
    });
  }
}

async function seedUsers() {
  const [adminPasswordHash, customerPasswordHash] = await Promise.all([
    bcrypt.hash(ADMIN_PASSWORD, 10),
    bcrypt.hash(CUSTOMER_PASSWORD, 10),
  ]);

  await db.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { passwordHash: adminPasswordHash, role: "ADMIN" },
    create: {
      email: ADMIN_EMAIL,
      name: "Jhunu Admin",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
    },
  });

  await db.user.upsert({
    where: { email: CUSTOMER_EMAIL },
    update: { passwordHash: customerPasswordHash, role: "CUSTOMER" },
    create: {
      email: CUSTOMER_EMAIL,
      name: "Test Customer",
      passwordHash: customerPasswordHash,
      role: "CUSTOMER",
    },
  });
}

async function main() {
  const categoryIdBySlug = await seedCategories();
  await seedProducts(categoryIdBySlug);
  await seedUsers();

  console.log(`Seeded ${CATEGORIES.length} categories and ${PRODUCTS.length} products.`);
  console.log("\nSeed user credentials (dev/local only — never reuse in production):");
  console.log(`  ADMIN    email: ${ADMIN_EMAIL}    password: ${ADMIN_PASSWORD}`);
  console.log(`  CUSTOMER email: ${CUSTOMER_EMAIL}      password: ${CUSTOMER_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
