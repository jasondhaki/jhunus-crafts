"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Minus, Plus, ShoppingBag, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/money";
import { useCartHasHydrated, useCartStore } from "@/store/cart";
import { getCartDetails, type CartDetails } from "@/actions/cart";
import { Skeleton } from "@/components/ui/skeleton";

const STEPPER_BUTTON_CLASS =
  "inline-flex size-8 items-center justify-center text-bark transition-colors duration-200 ease-out hover:bg-jute/10 disabled:pointer-events-none disabled:opacity-40";

export function CartDrawer() {
  const isOpen = useCartStore((state) => state.isOpen);
  const close = useCartStore((state) => state.close);
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const hasHydrated = useCartHasHydrated();
  const shouldReduceMotion = useReducedMotion();

  const [details, setDetails] = useState<CartDetails | null>(null);
  const [isPending, startTransition] = useTransition();

  // A stable key derived from contents (not the array reference) so the
  // fetch effect below re-runs exactly on productId/quantity changes,
  // matching "on open and after every mutation" without re-fetching on
  // every unrelated store update.
  const itemsKey = items.map((item) => `${item.productId}:${item.quantity}`).join(",");

  useEffect(() => {
    if (!isOpen || !hasHydrated) return;
    startTransition(async () => {
      const result = await getCartDetails(items);
      setDetails(result);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, hasHydrated, itemsKey]);

  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, close]);

  const lines = details?.lines ?? [];
  const adjustments = details?.adjustments ?? [];
  const subtotalCents = details?.subtotalCents ?? 0;
  const isEmpty = hasHydrated && items.length === 0;
  const showSkeleton = isPending && details === null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-bark/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.2, ease: "easeOut" }}
            onClick={close}
            aria-hidden="true"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-parchment shadow-xl"
            initial={shouldReduceMotion ? { opacity: 0 } : { x: "100%" }}
            animate={shouldReduceMotion ? { opacity: 1 } : { x: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { x: "100%" }}
            transition={{ duration: shouldReduceMotion ? 0.2 : 0.3, ease: "easeOut" }}
          >
            <div className="flex items-center justify-between border-b border-hairline p-6">
              <h2 className="font-serif text-2xl text-bark">Your Cart</h2>
              <button
                type="button"
                onClick={close}
                aria-label="Close cart"
                className="inline-flex size-9 items-center justify-center rounded-full text-bark transition-colors duration-200 ease-out hover:bg-jute/10"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            {adjustments.length > 0 && (
              <div
                role="status"
                className="mx-6 mt-4 space-y-1 rounded-md border border-terracotta/40 bg-terracotta/10 p-3 text-sm text-terracotta"
              >
                {adjustments.map((adjustment) => (
                  <p key={adjustment.productId} className="flex gap-2">
                    <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    <span>
                      {adjustment.reason === "removed"
                        ? `${adjustment.title} is no longer available and was removed from your cart.`
                        : `${adjustment.title} was reduced to ${adjustment.newQuantity} (limited stock).`}
                    </span>
                  </p>
                ))}
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-6">
              {isEmpty ? (
                <CartEmptyState onContinue={close} />
              ) : showSkeleton ? (
                <div className="space-y-6">
                  {items.map((item) => (
                    <div key={item.productId} className="flex gap-4">
                      <Skeleton className="size-20 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <ul className="space-y-6">
                  {lines.map((line) => (
                    <li key={line.productId} className="flex gap-4">
                      <div className="relative size-20 shrink-0 overflow-hidden rounded-md bg-jute/10">
                        {line.image && (
                          <Image
                            src={line.image}
                            alt={line.title}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div className="flex flex-1 flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/shop/${line.slug}`}
                            onClick={close}
                            className="font-serif text-bark transition-colors duration-200 ease-out hover:text-terracotta"
                          >
                            {line.title}
                          </Link>
                          <button
                            type="button"
                            onClick={() => removeItem(line.productId)}
                            aria-label={`Remove ${line.title} from cart`}
                            className="shrink-0 text-jute transition-colors duration-200 ease-out hover:text-terracotta"
                          >
                            <X className="size-4" aria-hidden="true" />
                          </button>
                        </div>
                        <p className="mt-1 text-sm text-jute">{formatPrice(line.priceCents)}</p>
                        <div className="mt-2 inline-flex w-fit items-center rounded-md border border-hairline">
                          <button
                            type="button"
                            onClick={() => updateQuantity(line.productId, line.quantity - 1)}
                            disabled={line.quantity <= 1}
                            aria-label={`Decrease quantity of ${line.title}`}
                            className={STEPPER_BUTTON_CLASS}
                          >
                            <Minus className="size-3.5" aria-hidden="true" />
                          </button>
                          <span className="w-8 text-center text-sm text-bark" aria-live="polite">
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(line.productId, line.quantity + 1)}
                            disabled={line.quantity >= line.stock}
                            aria-label={`Increase quantity of ${line.title}`}
                            className={STEPPER_BUTTON_CLASS}
                          >
                            <Plus className="size-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {!isEmpty && (
              <div className="border-t border-hairline p-6">
                <div className="flex items-center justify-between text-lg">
                  <span className="text-bark">Subtotal</span>
                  <span className="font-serif text-bark">{formatPrice(subtotalCents)}</span>
                </div>
                <p className="mt-1 text-xs text-jute">Shipping and taxes calculated at checkout.</p>
                <Link
                  href="/checkout"
                  className="mt-4 inline-flex h-14 w-full items-center justify-center rounded-md bg-terracotta px-7 text-lg font-medium text-cream transition-colors duration-200 ease-out hover:bg-terracotta/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jute focus-visible:ring-offset-2 focus-visible:ring-offset-parchment"
                >
                  Checkout
                </Link>
                <button
                  type="button"
                  onClick={close}
                  className="mt-3 w-full text-center text-sm text-jute transition-colors duration-200 ease-out hover:text-terracotta"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function CartEmptyState({ onContinue }: { onContinue: () => void }) {
  return (
    <div className={cn("flex h-full flex-col items-center justify-center text-center")}>
      <div className="flex size-20 items-center justify-center rounded-full bg-jute/10">
        <ShoppingBag className="size-9 text-jute" aria-hidden="true" />
      </div>
      <p className="mt-6 font-serif text-2xl text-bark">Your cart is empty</p>
      <p className="mt-2 max-w-xs text-sm text-jute">
        Every piece is handwoven and one of a kind — find something to bring home.
      </p>
      <Link
        href="/shop"
        onClick={onContinue}
        className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-terracotta px-5 text-base font-medium text-cream transition-colors duration-200 ease-out hover:bg-terracotta/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jute focus-visible:ring-offset-2 focus-visible:ring-offset-parchment"
      >
        Browse the Shop
      </Link>
    </div>
  );
}
