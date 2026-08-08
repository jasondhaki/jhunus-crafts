import Link from "next/link";
import type { Metadata } from "next";
import { getOrderStatus } from "@/actions/order";
import { Container } from "@/components/ui/container";
import { CheckoutSuccessStatus } from "@/components/checkout/checkout-success-status";

export const metadata: Metadata = {
  title: "Order Confirmation",
};

export default async function CheckoutSuccessPage({
  searchParams,
}: PageProps<"/checkout/success">) {
  const { order: orderNumber } = await searchParams;

  const order =
    typeof orderNumber === "string" ? await getOrderStatus(orderNumber) : null;

  if (!order) {
    return (
      <Container className="py-16">
        <div className="flex flex-col items-center py-16 text-center">
          <h1 className="font-serif text-3xl text-bark">We couldn&rsquo;t find that order</h1>
          <p className="mt-2 max-w-sm text-jute">
            The order number in this link doesn&rsquo;t match anything on file. If you just
            completed a purchase, check your email for a confirmation.
          </p>
          <Link
            href="/shop"
            className="mt-8 inline-flex h-11 items-center justify-center rounded-md bg-terracotta px-5 text-base font-medium text-cream transition-colors duration-200 ease-out hover:bg-terracotta/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jute focus-visible:ring-offset-2 focus-visible:ring-offset-parchment"
          >
            Back to Shop
          </Link>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-16">
      <CheckoutSuccessStatus initialOrder={order} />
    </Container>
  );
}
