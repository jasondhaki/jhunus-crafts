import type { Metadata } from "next";
import { auth } from "../../../auth";
import { Container } from "@/components/ui/container";
import { CheckoutPageClient } from "@/components/checkout/checkout-page-client";

export const metadata: Metadata = {
  title: "Checkout",
};

export default async function CheckoutPage() {
  const session = await auth();

  return (
    <Container className="py-16">
      <h1 className="mb-10 font-serif text-4xl text-bark">Checkout</h1>
      <CheckoutPageClient initialEmail={session?.user?.email ?? undefined} />
    </Container>
  );
}
