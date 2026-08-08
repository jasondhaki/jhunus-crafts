import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { OfflineBanner } from "@/components/layout/offline-banner";
import { CartDrawer } from "@/components/shop/cart-drawer";
import { WishlistMergeGate } from "@/components/shop/wishlist-merge-gate";
import { SITE_URL } from "@/lib/site-config";
import { auth } from "../../auth";
import "./globals.css";

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    template: "%s | Jhunu's Crafts",
    default: "Jhunu's Crafts | Handcrafted Jute Bags & Home Goods",
  },
  description:
    "Handwoven jute bags, baskets, and home goods, made by a small collective of artisans practicing a craft passed down for generations.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await auth();

  return (
    <html
      lang="en"
      className={`${playfairDisplay.variable} ${plusJakartaSans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-parchment font-sans text-bark">
        <OfflineBanner />
        <Header user={session?.user ?? null} />
        <main className="flex-1">{children}</main>
        <Footer />
        <CartDrawer />
        <WishlistMergeGate isAuthenticated={!!session?.user} />
      </body>
    </html>
  );
}
