import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth-guards";
import { getOrderForUser } from "@/lib/order-query";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/money";
import { shippingAddressSchema } from "@/lib/checkout-schemas";
import { OrderStatusPill } from "@/components/account/order-status-pill";
import { OrderStatusTimeline } from "@/components/account/order-status-timeline";
import { ReorderButton } from "@/components/account/reorder-button";

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "long" });

export async function generateMetadata({
  params,
}: PageProps<"/account/orders/[orderNumber]">): Promise<Metadata> {
  const { orderNumber } = await params;
  return { title: `Order ${orderNumber}` };
}

export default async function OrderDetailPage({
  params,
}: PageProps<"/account/orders/[orderNumber]">) {
  const user = await requireUser();
  const { orderNumber } = await params;

  const order = await getOrderForUser(user.id, orderNumber);

  // 404, never 403: an order that exists but belongs to someone else must
  // be indistinguishable from an order number that doesn't exist at all.
  // A 403 (or any other "yes, this is real" signal) would let one
  // customer probe for other customers' valid order numbers.
  if (!order) {
    notFound();
  }

  // Read live product state ONLY to decorate the invoice with an
  // availability hint (for the Reorder button below) — never to alter
  // what's actually displayed. Every visible title/price/image on this
  // page comes from the OrderItem snapshot; a historical invoice must
  // never mutate just because a product was renamed, repriced, or pulled.
  const productIds = order.items.map((item) => item.productId);
  const products = await db.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, isActive: true, stock: true },
  });
  const availabilityById = new Map(products.map((product) => [product.id, product]));

  const shippingAddress = shippingAddressSchema.safeParse(order.shippingAddr);

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/account/orders"
            className="text-sm text-jute transition-colors duration-200 ease-out hover:text-terracotta"
          >
            &larr; Back to Orders
          </Link>
          <h1 className="mt-2 font-serif text-3xl text-bark">Order {order.orderNumber}</h1>
          <p className="mt-1 text-sm text-jute">Placed {dateFormatter.format(order.createdAt)}</p>
        </div>
        <OrderStatusPill status={order.status} />
      </div>

      <OrderStatusTimeline status={order.status} />

      <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <h2 className="font-serif text-xl text-bark">Items</h2>
          <ul className="divide-y divide-hairline rounded-lg border border-hairline bg-cream">
            {order.items.map((item) => {
              const availability = availabilityById.get(item.productId);
              const isUnavailable = !availability || !availability.isActive;
              const isSoldOut = !isUnavailable && availability.stock <= 0;

              return (
                <li key={item.id} className="flex gap-4 p-4">
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-md bg-jute/10">
                    {item.imageSnapshot && (
                      <Image
                        src={item.imageSnapshot}
                        alt={item.titleSnapshot}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col justify-center">
                    <p className="font-serif text-bark">{item.titleSnapshot}</p>
                    <p className="mt-1 text-sm text-jute">
                      Qty {item.quantity} &times; {formatPrice(item.unitPriceCents)}
                    </p>
                    {(isUnavailable || isSoldOut) && (
                      <p className="mt-1 text-xs text-terracotta">
                        {isUnavailable ? "No longer available" : "Currently sold out"}
                      </p>
                    )}
                  </div>
                  <p className="self-center font-medium text-bark">
                    {formatPrice(item.unitPriceCents * item.quantity)}
                  </p>
                </li>
              );
            })}
          </ul>

          <ReorderButton orderNumber={order.orderNumber} />
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-hairline bg-cream p-6">
            <h2 className="font-serif text-lg text-bark">Cost Breakdown</h2>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-jute">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotalCents)}</span>
              </div>
              <div className="flex justify-between text-jute">
                <span>Shipping</span>
                <span>{formatPrice(order.shippingCents)}</span>
              </div>
              <div className="flex justify-between border-t border-hairline pt-2 text-base font-medium text-bark">
                <span>Total</span>
                <span>{formatPrice(order.totalCents)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-hairline bg-cream p-6">
            <h2 className="font-serif text-lg text-bark">Shipping Address</h2>
            {shippingAddress.success ? (
              <address className="mt-4 text-sm not-italic leading-relaxed text-jute">
                {shippingAddress.data.fullName}
                <br />
                {shippingAddress.data.line1}
                <br />
                {shippingAddress.data.line2 && (
                  <>
                    {shippingAddress.data.line2}
                    <br />
                  </>
                )}
                {shippingAddress.data.city}, {shippingAddress.data.state}{" "}
                {shippingAddress.data.postalCode}
                <br />
                {shippingAddress.data.country}
                {shippingAddress.data.phone && (
                  <>
                    <br />
                    {shippingAddress.data.phone}
                  </>
                )}
              </address>
            ) : (
              <p className="mt-4 text-sm text-jute">Shipping address unavailable.</p>
            )}
          </div>

          <div className="rounded-lg border border-hairline bg-cream p-6">
            <h2 className="font-serif text-lg text-bark">Contact</h2>
            <p className="mt-4 text-sm text-jute">{order.email}</p>
            {order.phone && <p className="text-sm text-jute">{order.phone}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
