import { Container } from "@/components/ui/container";
import { requireAdmin } from "@/lib/auth-guards";

export const metadata = {
  title: "Admin",
};

export default async function AdminPage() {
  // Independently re-checks ADMIN here, even though middleware already
  // protects /admin/:path* — per CLAUDE.md rule 7, middleware alone isn't
  // sufficient since Server Actions can be invoked directly.
  const user = await requireAdmin();

  return (
    <Container className="py-24">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-jute">
        Admin
      </p>
      <h1 className="mt-2 font-serif text-4xl text-bark">
        Welcome, {user.name ?? user.email}
      </h1>
      <p className="mt-4 max-w-md text-jute">
        Product, order, and catalog management land here in a later phase.
      </p>
    </Container>
  );
}
