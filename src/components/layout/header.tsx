"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Container } from "@/components/ui/container";
import { Separator } from "@/components/ui/separator";

const NAV_LINKS = [
  { href: "/shop", label: "Shop" },
  { href: "/categories", label: "Categories" },
  { href: "/our-story", label: "Our Story" },
];

const ICON_BUTTON_CLASS =
  "inline-flex size-10 items-center justify-center rounded-full transition-colors duration-200 ease-out hover:bg-current/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jute focus-visible:ring-offset-2 focus-visible:ring-offset-parchment";

interface HeaderProps {
  cartCount?: number;
}

export function Header({ cartCount = 0 }: HeaderProps) {
  const pathname = usePathname();
  const isHomepage = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  const transparent = isHomepage && !scrolled;

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-colors duration-200 ease-out",
        transparent
          ? "bg-transparent text-cream"
          : "border-b border-hairline bg-parchment text-bark",
      )}
    >
      <Container className="relative flex h-20 items-center justify-between">
        <div className="flex items-center">
          <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium tracking-wide transition-colors duration-200 ease-out hover:opacity-70"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <button
            type="button"
            className={cn(ICON_BUTTON_CLASS, "-ml-2 md:hidden")}
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>
        </div>

        <Link
          href="/"
          className="absolute left-1/2 -translate-x-1/2 font-serif text-xl tracking-wide sm:text-2xl"
        >
          Jhunu&rsquo;s Crafts
        </Link>

        <div className="flex items-center gap-1">
          <Link href="/search" className={cn(ICON_BUTTON_CLASS, "hidden md:inline-flex")} aria-label="Search">
            <Search className="size-5" aria-hidden="true" />
          </Link>
          <Link href="/wishlist" className={cn(ICON_BUTTON_CLASS, "hidden md:inline-flex")} aria-label="Wishlist">
            <Heart className="size-5" aria-hidden="true" />
          </Link>
          <Link href="/account" className={cn(ICON_BUTTON_CLASS, "hidden md:inline-flex")} aria-label="Account">
            <User className="size-5" aria-hidden="true" />
          </Link>
          <Link
            href="/cart"
            className={cn(ICON_BUTTON_CLASS, "relative")}
            aria-label={cartCount > 0 ? `Cart, ${cartCount} items` : "Cart"}
          >
            <ShoppingBag className="size-5" aria-hidden="true" />
            {cartCount > 0 && (
              <span className="absolute right-0.5 top-0.5 flex size-4 items-center justify-center rounded-full bg-terracotta text-[10px] font-semibold text-cream">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </Container>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-bark/40 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.2, ease: "easeOut" }}
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              id="mobile-nav"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation"
              className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xs flex-col bg-parchment p-6 text-bark shadow-xl md:hidden"
              initial={shouldReduceMotion ? { opacity: 0 } : { x: "100%" }}
              animate={shouldReduceMotion ? { opacity: 1 } : { x: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { x: "100%" }}
              transition={{ duration: shouldReduceMotion ? 0.2 : 0.3, ease: "easeOut" }}
            >
              <div className="flex items-center justify-between">
                <span className="font-serif text-xl">Menu</span>
                <button
                  type="button"
                  className={ICON_BUTTON_CLASS}
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                  autoFocus
                >
                  <X className="size-5" aria-hidden="true" />
                </button>
              </div>

              <nav className="mt-8 flex flex-col gap-6" aria-label="Mobile primary">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-lg font-medium"
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              <Separator className="my-6" />

              <div className="flex flex-col gap-5">
                <Link href="/search" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
                  <Search className="size-5" aria-hidden="true" />
                  Search
                </Link>
                <Link href="/wishlist" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
                  <Heart className="size-5" aria-hidden="true" />
                  Wishlist
                </Link>
                <Link href="/account" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
                  <User className="size-5" aria-hidden="true" />
                  Account
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
