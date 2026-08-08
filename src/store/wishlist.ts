import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { cookieStorage } from "@/store/cookie-storage";

interface WishlistState {
  productIds: string[];
  hasHydrated: boolean;
  add: (productId: string) => void;
  remove: (productId: string) => void;
  toggle: (productId: string) => void;
  clear: () => void;
  setHasHydrated: (value: boolean) => void;
}

// Guest-only wishlist. Signed-in users are backed by the WishlistItem table
// instead (see src/actions/wishlist.ts) — this store only ever holds
// productIds, and its contents are merged into the database and cleared on
// sign-in (see components/shop/wishlist-merge-gate.tsx).
export const useWishlistStore = create<WishlistState>()(
  persist(
    (set) => ({
      productIds: [],
      hasHydrated: false,

      add: (productId) =>
        set((state) =>
          state.productIds.includes(productId)
            ? state
            : { productIds: [...state.productIds, productId] },
        ),

      remove: (productId) =>
        set((state) => ({ productIds: state.productIds.filter((id) => id !== productId) })),

      toggle: (productId) =>
        set((state) =>
          state.productIds.includes(productId)
            ? { productIds: state.productIds.filter((id) => id !== productId) }
            : { productIds: [...state.productIds, productId] },
        ),

      clear: () => set({ productIds: [] }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "jhunu-wishlist",
      storage: createJSONStorage(() => cookieStorage),
      partialize: (state) => ({ productIds: state.productIds }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

export function useWishlistHasHydrated(): boolean {
  return useWishlistStore((state) => state.hasHydrated);
}
