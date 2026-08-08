import type { Metadata } from "next";
import { auth } from "../../../auth";
import { getWishlistForUser } from "@/lib/wishlist-query";
import { Container } from "@/components/ui/container";
import { WishlistAuthedView } from "@/components/shop/wishlist-authed-view";
import { WishlistGuestView } from "@/components/shop/wishlist-guest-view";

export const metadata: Metadata = {
  title: "Wishlist",
};

export default async function WishlistPage() {
  const session = await auth();

  return (
    <Container className="py-16">
      <h1 className="font-serif text-4xl text-bark">Your Wishlist</h1>
      <p className="mt-2 text-jute">Pieces you&rsquo;ve saved for later.</p>

      <div className="mt-10">
        {session?.user ? (
          <AuthedWishlist userId={session.user.id} />
        ) : (
          <WishlistGuestView />
        )}
      </div>
    </Container>
  );
}

async function AuthedWishlist({ userId }: { userId: string }) {
  const products = await getWishlistForUser(userId);
  return <WishlistAuthedView initialProducts={products} />;
}
