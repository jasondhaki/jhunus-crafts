import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/auth-guards";
import { AdminNav } from "@/components/admin/admin-nav";
import { ToastHost } from "@/components/admin/toast-host";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Independently re-checks ADMIN here even though middleware already
  // protects /admin/:path* — per CLAUDE.md rule 7, middleware alone isn't
  // sufficient since Server Actions can be invoked directly.
  await requireAdmin();

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-bark lg:flex">
      <AdminNav />
      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      <ToastHost />
    </div>
  );
}
