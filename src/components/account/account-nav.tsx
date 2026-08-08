"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Home, MapPin, Package, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/account", label: "Overview", icon: Home, exact: true },
  { href: "/account/orders", label: "Orders", icon: Package, exact: false },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart, exact: false },
  { href: "/account/addresses", label: "Addresses", icon: MapPin, exact: false },
  { href: "/account/settings", label: "Settings", icon: Settings, exact: false },
] as const;

function isActive(pathname: string, href: string, exact: boolean): boolean {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

// Renders both a mobile horizontal-tabs row and a desktop vertical
// sidebar — each self-hides via Tailwind's lg: prefix, so exactly one is
// visible at any given viewport width, matching "collapsing to horizontal
// tabs on mobile."
export function AccountNav() {
  const pathname = usePathname();

  return (
    <>
      <nav aria-label="Account" className="mb-8 -mx-4 overflow-x-auto px-4 lg:hidden">
        <div className="flex gap-2">
          {NAV_LINKS.map((link) => {
            const active = isActive(pathname, link.href, link.exact);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-200 ease-out",
                  active
                    ? "border-terracotta bg-terracotta/10 text-terracotta"
                    : "border-hairline text-jute hover:border-jute hover:text-bark",
                )}
              >
                <link.icon className="size-4" aria-hidden="true" />
                {link.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <nav aria-label="Account" className="hidden lg:block">
        <ul className="space-y-1">
          {NAV_LINKS.map((link) => {
            const active = isActive(pathname, link.href, link.exact);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors duration-200 ease-out",
                    active ? "bg-terracotta/10 text-terracotta" : "text-jute hover:bg-jute/5 hover:text-bark",
                  )}
                >
                  <link.icon className="size-4" aria-hidden="true" />
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
