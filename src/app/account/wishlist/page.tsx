import type { Metadata } from "next";
import { requireUser } from "@/lib/auth-guards";
import { getWishlistForUser } from "@/lib/wishlist-query";
import { AccountWishlistGrid } from "@/components/account/account-wishlist-grid";

export const metadata: Metadata = {
  title: "Wishlist",
};

export default async function AccountWishlistPage() {
  const user = await requireUser();
  const products = await getWishlistForUser(user.id);

  return (
    <div>
      <h1 className="font-serif text-4xl text-bark">Wishlist</h1>
      <p className="mt-2 text-jute">Pieces you&rsquo;ve saved for later.</p>
      <div className="mt-8">
        <AccountWishlistGrid initialProducts={products} />
      </div>
    </div>
  );
}
