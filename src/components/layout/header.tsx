"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Heart, LayoutDashboard, LogOut, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Container } from "@/components/ui/container";
import { Separator } from "@/components/ui/separator";
import { UserMenu, type UserMenuUser } from "@/components/layout/user-menu";
import { signOutAction } from "@/actions/auth";
import { useCartHasHydrated, useCartStore } from "@/store/cart";
import { useFocusTrap } from "@/lib/use-focus-trap";

const NAV_LINKS = [
  { href: "/shop", label: "Shop" },
  { href: "/categories", label: "Categories" },
  { href: "/our-story", label: "Our Story" },
];

const ICON_BUTTON_CLASS =
  "inline-flex size-10 items-center justify-center rounded-full transition-colors duration-200 ease-out hover:bg-current/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jute focus-visible:ring-offset-2 focus-visible:ring-offset-parchment";

interface HeaderProps {
  user?: UserMenuUser | null;
}

export function Header({ user = null }: HeaderProps) {
  const pathname = usePathname();
  const isHomepage = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileNavRef = useRef<HTMLDivElement>(null);
  useFocusTrap(mobileNavRef, mobileOpen);
  const shouldReduceMotion = useReducedMotion();

  const cartItems = useCartStore((state) => state.items);
  const toggleCart = useCartStore((state) => state.toggle);
  const cartHasHydrated = useCartHasHydrated();
  // Gate the rendered count on hydration so SSR (which never sees the
  // cart cookie) and the first client render agree — avoids a hydration
  // mismatch as soon as a real cart cookie exists.
  const cartCount = cartHasHydrated
    ? cartItems.reduce((total, item) => total + item.quantity, 0)
    : 0;

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
          <div className="hidden md:inline-flex">
            <UserMenu user={user} />
          </div>
          <button
            type="button"
            onClick={toggleCart}
            className={cn(ICON_BUTTON_CLASS, "relative")}
            aria-label={cartCount > 0 ? `Cart, ${cartCount} items` : "Cart"}
          >
            <ShoppingBag className="size-5" aria-hidden="true" />
            {cartCount > 0 && (
              <span className="absolute right-0.5 top-0.5 flex size-4 items-center justify-center rounded-full bg-terracotta text-[10px] font-semibold text-cream">
                {cartCount}
              </span>
            )}
          </button>
          {/* The badge above is aria-hidden via the icon-only button's own
              aria-label, which only gets read when the button itself is
              focused — it's silent when the count changes from elsewhere
              (e.g. an "Add to Cart" click on a product page). This region
              mirrors the count as text so screen readers announce it on
              every change regardless of where focus currently is. */}
          <span aria-live="polite" className="sr-only">
            {cartHasHydrated
              ? `Cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}`
              : ""}
          </span>
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
              ref={mobileNavRef}
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
                {user ? (
                  <>
                    <Link
                      href="/account"
                      className="flex items-center gap-3"
                      onClick={() => setMobileOpen(false)}
                    >
                      <User className="size-5" aria-hidden="true" />
                      Account
                    </Link>
                    {user.role === "ADMIN" && (
                      <Link
                        href="/admin"
                        className="flex items-center gap-3"
                        onClick={() => setMobileOpen(false)}
                      >
                        <LayoutDashboard className="size-5" aria-hidden="true" />
                        Admin
                      </Link>
                    )}
                    <form action={signOutAction}>
                      <button type="submit" className="flex items-center gap-3">
                        <LogOut className="size-5" aria-hidden="true" />
                        Sign out
                      </button>
                    </form>
                  </>
                ) : (
                  <Link
                    href="/login"
                    className="flex items-center gap-3"
                    onClick={() => setMobileOpen(false)}
                  >
                    <User className="size-5" aria-hidden="true" />
                    Sign In
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
