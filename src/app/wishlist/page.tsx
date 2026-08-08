import type { Metadata } from "next";
import { auth } from "../../../auth";
import { db } from "@/lib/db";
import { Container } from "@/components/ui/container";
import { WishlistAuthedView } from "@/components/shop/wishlist-authed-view";
import { WishlistGuestView } from "@/components/shop/wishlist-guest-view";
import type { WishlistProduct } from "@/actions/wishlist";

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
  const items = await db.wishlistItem.findMany({
    where: { userId },
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });

  const products: WishlistProduct[] = items
    .filter((item) => item.product.isActive)
    .map((item) => ({
      productId: item.product.id,
      slug: item.product.slug,
      title: item.product.title,
      priceCents: item.product.priceCents,
      compareAtCents: item.product.compareAtCents,
      stock: item.product.stock,
      images: item.product.images,
    }));

  return <WishlistAuthedView initialProducts={products} />;
}
