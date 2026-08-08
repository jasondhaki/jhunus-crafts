import { Container } from "@/components/ui/container";
import { requireUser } from "@/lib/auth-guards";

export const metadata = {
  title: "My Account",
};

export default async function AccountPage() {
  const user = await requireUser();

  return (
    <Container className="py-24">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-jute">
        My Account
      </p>
      <h1 className="mt-2 font-serif text-4xl text-bark">
        Welcome, {user.name ?? user.email}
      </h1>
      <p className="mt-4 max-w-md text-jute">
        Order history, saved addresses, and account details land here in a
        later phase.
      </p>
    </Container>
  );
}
