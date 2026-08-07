import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

// Same placeholder pool used elsewhere in the app — confirmed to resolve,
// but not jute-specific. Swap for real photography before this ships.
const PANEL_IMAGE =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80";

interface AuthSplitLayoutProps {
  eyebrow: string;
  title: string;
  children: ReactNode;
}

export function AuthSplitLayout({ eyebrow, title, children }: AuthSplitLayoutProps) {
  return (
    <div className="grid min-h-[calc(100vh-5rem)] lg:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-16 sm:px-12">
        <div className="w-full max-w-sm">
          <Link href="/" className="font-serif text-2xl text-bark">
            Jhunu&rsquo;s Crafts
          </Link>
          <p className="mt-8 text-sm font-medium uppercase tracking-[0.2em] text-jute">
            {eyebrow}
          </p>
          <h1 className="mt-2 font-serif text-3xl text-bark">{title}</h1>
          <div className="mt-8">{children}</div>
        </div>
      </div>
      <div className="relative hidden lg:block">
        <Image
          src={PANEL_IMAGE}
          alt="Close-up texture of hand-woven jute fiber"
          fill
          sizes="50vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-bark/20" />
      </div>
    </div>
  );
}
