import Link from "next/link";
import { Heart } from "lucide-react";

export function WishlistEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-hairline bg-cream py-24 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-jute/10">
        <Heart className="size-9 text-jute" aria-hidden="true" />
      </div>
      <p className="mt-6 font-serif text-2xl text-bark">Your wishlist is empty</p>
      <p className="mt-2 max-w-sm text-sm text-jute">
        Save the pieces that catch your eye and come back to them anytime.
      </p>
      <Link
        href="/shop"
        className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-terracotta px-5 text-base font-medium text-cream transition-colors duration-200 ease-out hover:bg-terracotta/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jute focus-visible:ring-offset-2 focus-visible:ring-offset-parchment"
      >
        Browse the Shop
      </Link>
    </div>
  );
}
