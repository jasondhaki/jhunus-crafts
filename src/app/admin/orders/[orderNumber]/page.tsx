import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth-guards";
import { getAdminOrderByNumber } from "@/lib/admin/order-query";
import { formatPrice } from "@/lib/money";
import { shippingAddressSchema } from "@/lib/checkout-schemas";
import { OrderStatusPill } from "@/components/account/order-status-pill";
import { OrderStatusUpdateForm } from "@/components/admin/order-status-update-form";
import { AdminOrderTimeline } from "@/components/admin/admin-order-timeline";

export async function generateMetadata({
  params,
}: PageProps<"/admin/orders/[orderNumber]">): Promise<Metadata> {
  const { orderNumber } = await params;
  return { title: `Order ${orderNumber}` };
}

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "long" });

export default async function AdminOrderDetailPage({
  params,
}: PageProps<"/admin/orders/[orderNumber]">) {
  await requireAdmin();
  const { orderNumber } = await params;

  // NOT scoped by userId — admins can view any order, unlike the
  // customer-facing getOrderForUser.
  const order = await getAdminOrderByNumber(orderNumber);
  if (!order) {
    notFound();
  }

  const shippingAddress = shippingAddressSchema.safeParse(order.shippingAddr);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/admin/orders" className="text-sm text-gray-500 hover:text-terracotta">
            &larr; Back to Orders
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-bark">Order {order.orderNumber}</h1>
          <p className="mt-1 text-sm text-gray-500">Placed {dateFormatter.format(order.createdAt)}</p>
        </div>
        <OrderStatusPill status={order.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-bark">Items</h2>
            <ul className="mt-4 divide-y divide-gray-100">
              {order.items.map((item) => (
                <li key={item.id} className="flex gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded bg-gray-100">
                    {item.imageSnapshot && (
                      <Image
                        src={item.imageSnapshot}
                        alt={item.titleSnapshot}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col justify-center">
                    <p className="text-sm font-medium text-bark">{item.titleSnapshot}</p>
                    <p className="text-xs text-gray-500">
                      Qty {item.quantity} &times; {formatPrice(item.unitPriceCents)}
                    </p>
                  </div>
                  <p className="self-center text-sm font-medium text-bark">
                    {formatPrice(item.unitPriceCents * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-1.5 border-t border-gray-100 pt-4 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotalCents)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Shipping</span>
                <span>{formatPrice(order.shippingCents)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-1.5 font-medium text-bark">
                <span>Total</span>
                <span>{formatPrice(order.totalCents)}</span>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-bark">Audit Trail</h2>
            <div className="mt-4">
              <AdminOrderTimeline events={order.statusEvents} />
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-bark">Contact</h2>
            <p className="mt-3 text-sm text-gray-600">{order.email}</p>
            {order.phone && <p className="text-sm text-gray-600">{order.phone}</p>}
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-bark">Shipping Address</h2>
            {shippingAddress.success ? (
              <address className="mt-3 text-sm not-italic leading-relaxed text-gray-600">
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
              </address>
            ) : (
              <p className="mt-3 text-sm text-gray-500">Unavailable.</p>
            )}
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-bark">Update Status</h2>
            <div className="mt-4">
              <OrderStatusUpdateForm orderId={order.id} currentStatus={order.status} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
