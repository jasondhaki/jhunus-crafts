import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { cookieStorage } from "@/store/cookie-storage";

export interface CartItem {
  productId: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  // Per CLAUDE.md rule 1/2, this store NEVER holds prices, titles, or
  // images — those are always re-fetched from the database (see
  // src/actions/cart.ts) so a stale cookie can't display a stale price.
  hasHydrated: boolean;
  addItem: (productId: string, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
  setHasHydrated: (value: boolean) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      hasHydrated: false,

      addItem: (productId, quantity = 1) =>
        set((state) => {
          const existing = state.items.find((item) => item.productId === productId);
          if (existing) {
            return {
              items: state.items.map((item) =>
                item.productId === productId
                  ? { ...item, quantity: item.quantity + quantity }
                  : item,
              ),
            };
          }
          return { items: [...state.items, { productId, quantity }] };
        }),

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        })),

      // A quantity of zero or less removes the line entirely rather than
      // leaving a dead 0-quantity row in the cookie.
      updateQuantity: (productId, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            return { items: state.items.filter((item) => item.productId !== productId) };
          }
          return {
            items: state.items.map((item) =>
              item.productId === productId ? { ...item, quantity } : item,
            ),
          };
        }),

      clear: () => set({ items: [] }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((state) => ({ isOpen: !state.isOpen })),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "jhunu-cart",
      storage: createJSONStorage(() => cookieStorage),
      // isOpen/hasHydrated are transient UI state, not cart contents — keep
      // them out of the cookie.
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

// Components must gate any rendered cart count/quantity on this flag.
// Server-rendered HTML always sees an empty cart (no cookie access during
// SSR), so rendering `items` before rehydration completes on the client
// would produce a hydration mismatch as soon as a real cookie exists.
export function useCartHasHydrated(): boolean {
  return useCartStore((state) => state.hasHydrated);
}
