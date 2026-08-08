"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Heart, LayoutDashboard, LogOut, Package, User as UserIcon } from "lucide-react";
import type { Role } from "@prisma/client";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/actions/auth";

export interface UserMenuUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: Role;
}

const ICON_BUTTON_CLASS =
  "inline-flex size-10 items-center justify-center rounded-full transition-colors duration-200 ease-out hover:bg-current/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jute focus-visible:ring-offset-2 focus-visible:ring-offset-parchment";

const MENU_ITEM_CLASS =
  "flex items-center gap-2 px-4 py-2 text-sm text-bark transition-colors duration-200 ease-out hover:bg-jute/10";

function getInitials(nameOrEmail: string): string {
  const trimmed = nameOrEmail.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0] + parts[parts.length - 1]![0]).toUpperCase();
}

export function UserMenu({ user }: { user: UserMenuUser | null }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!user) {
    return (
      <Link href="/login" className={ICON_BUTTON_CLASS} aria-label="Sign in">
        <UserIcon className="size-5" aria-hidden="true" />
      </Link>
    );
  }

  const initials = getInitials(user.name ?? user.email ?? "");

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(ICON_BUTTON_CLASS, "overflow-hidden")}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
      >
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- small avatar, next/image overhead isn't worth it here
          <img src={user.image} alt="" className="size-full object-cover" />
        ) : (
          <span className="text-xs font-semibold">{initials}</span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account"
          className="absolute right-0 top-full mt-2 w-48 rounded-md border border-hairline bg-cream py-1 shadow-lg"
        >
          <Link href="/account" role="menuitem" className={MENU_ITEM_CLASS} onClick={() => setOpen(false)}>
            <UserIcon className="size-4" aria-hidden="true" />
            Account
          </Link>
          <Link
            href="/account/orders"
            role="menuitem"
            className={MENU_ITEM_CLASS}
            onClick={() => setOpen(false)}
          >
            <Package className="size-4" aria-hidden="true" />
            Orders
          </Link>
          <Link href="/wishlist" role="menuitem" className={MENU_ITEM_CLASS} onClick={() => setOpen(false)}>
            <Heart className="size-4" aria-hidden="true" />
            Wishlist
          </Link>
          {user.role === "ADMIN" && (
            <Link href="/admin" role="menuitem" className={MENU_ITEM_CLASS} onClick={() => setOpen(false)}>
              <LayoutDashboard className="size-4" aria-hidden="true" />
              Admin
            </Link>
          )}
          <form action={signOutAction}>
            <button type="submit" role="menuitem" className={cn(MENU_ITEM_CLASS, "w-full text-left")}>
              <LogOut className="size-4" aria-hidden="true" />
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
