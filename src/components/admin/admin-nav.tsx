"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, FolderTree, LayoutDashboard, Package, ShoppingBag, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Products", icon: Package, exact: false },
  { href: "/admin/categories", label: "Categories", icon: FolderTree, exact: false },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag, exact: false },
  { href: "/admin/reviews", label: "Reviews", icon: Star, exact: false },
] as const;

function isActive(pathname: string, href: string, exact: boolean): boolean {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

// Bark-heavy and denser by design (CLAUDE.md's storefront palette
// otherwise uses bark only for text/high-contrast accents) — the point is
// that this must never be mistaken for the storefront at a glance.
export function AdminNav() {
  const pathname = usePathname();

  return (
    <>
      <nav aria-label="Admin" className="border-b border-cream/10 bg-bark lg:hidden">
        <div className="flex gap-1 overflow-x-auto px-3 py-2">
          {NAV_LINKS.map((link) => {
            const active = isActive(pathname, link.href, link.exact);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded px-3 py-1.5 text-sm font-medium transition-colors duration-200 ease-out",
                  active ? "bg-terracotta text-cream" : "text-cream/70 hover:bg-cream/10 hover:text-cream",
                )}
              >
                <link.icon className="size-4" aria-hidden="true" />
                {link.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <nav aria-label="Admin" className="hidden w-56 shrink-0 bg-bark lg:block">
        <div className="sticky top-0 flex h-screen flex-col p-4">
          <Link href="/admin" className="mb-8 px-2 text-lg font-semibold tracking-tight text-cream">
            Jhunu&rsquo;s Admin
          </Link>
          <ul className="space-y-1">
            {NAV_LINKS.map((link) => {
              const active = isActive(pathname, link.href, link.exact);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200 ease-out",
                      active ? "bg-terracotta text-cream" : "text-cream/70 hover:bg-cream/10 hover:text-cream",
                    )}
                  >
                    <link.icon className="size-4" aria-hidden="true" />
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="mt-auto border-t border-cream/10 pt-4">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-cream/60 transition-colors duration-200 ease-out hover:bg-cream/10 hover:text-cream"
            >
              <ExternalLink className="size-4" aria-hidden="true" />
              View Storefront
            </Link>
          </div>
        </div>
      </nav>
    </>
  );
}
