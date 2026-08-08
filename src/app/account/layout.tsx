import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth-guards";
import { Container } from "@/components/ui/container";
import { AccountNav } from "@/components/account/account-nav";

export default async function AccountLayout({ children }: { children: ReactNode }) {
  // Every /account route sits behind this — Server Components below still
  // independently call requireUser() themselves too, both because it's
  // cheap (auth() is request-deduped) and because it's what actually gives
  // each page the session.user.id it needs to scope its own queries.
  await requireUser();

  return (
    <Container className="py-12 lg:py-16">
      <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-12">
        <AccountNav />
        <div>{children}</div>
      </div>
    </Container>
  );
}
