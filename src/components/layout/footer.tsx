import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Separator } from "@/components/ui/separator";
import { NewsletterForm } from "@/components/layout/newsletter-form";

const SHOP_LINKS = [
  { href: "/shop?category=tote-bags", label: "Tote Bags" },
  { href: "/shop?category=storage-baskets", label: "Storage Baskets" },
  { href: "/shop?category=home-decor", label: "Home Decor" },
  { href: "/shop?category=accessories", label: "Accessories" },
];

const CARE_LINKS = [
  { href: "/care", label: "Care Guide" },
  { href: "/materials", label: "Our Materials" },
  { href: "/sustainability", label: "Sustainability" },
];

const ABOUT_LINKS = [
  { href: "/our-story", label: "Our Story" },
  { href: "/artisans", label: "The Weavers" },
  { href: "/shop", label: "Shop All" },
];

const SOCIAL_LINKS = ["Instagram", "Pinterest", "Facebook"];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-hairline bg-parchment text-bark">
      <Container className="py-16">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          <div>
            <h3 className="font-serif text-lg">About</h3>
            <p className="mt-3 text-sm text-jute">
              Handwoven jute bags, baskets, and home goods made by a small
              collective of artisans practicing a craft passed down for
              generations.
            </p>
            <ul className="mt-4 space-y-2">
              {ABOUT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors duration-200 ease-out hover:text-terracotta"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-serif text-lg">Shop</h3>
            <ul className="mt-4 space-y-2">
              {SHOP_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors duration-200 ease-out hover:text-terracotta"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-serif text-lg">Care &amp; Materials</h3>
            <ul className="mt-4 space-y-2">
              {CARE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors duration-200 ease-out hover:text-terracotta"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-serif text-lg">Contact</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <a
                  href="mailto:hello@jhunuscrafts.com"
                  className="transition-colors duration-200 ease-out hover:text-terracotta"
                >
                  hello@jhunuscrafts.com
                </a>
              </li>
              <li className="text-jute">Woven in West Bengal, shipped worldwide.</li>
              <li>
                <Link
                  href="/shipping-returns"
                  className="transition-colors duration-200 ease-out hover:text-terracotta"
                >
                  Shipping &amp; Returns
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-12" />

        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <h3 className="font-serif text-lg">Join the Workshop List</h3>
            <p className="mt-2 text-sm text-jute">
              New releases, restock notices, and care notes — a few times a
              season, never more.
            </p>
            <NewsletterForm />
          </div>

          <nav aria-label="Social" className="flex gap-6 sm:pt-1">
            {SOCIAL_LINKS.map((label) => (
              <a
                key={label}
                href="#"
                className="text-sm font-medium tracking-wide transition-colors duration-200 ease-out hover:text-terracotta"
              >
                {label}
              </a>
            ))}
          </nav>
        </div>

        <p className="mt-12 text-xs text-jute">
          &copy; {year} Jhunu&rsquo;s Crafts. All rights reserved.
        </p>
      </Container>
    </footer>
  );
}
