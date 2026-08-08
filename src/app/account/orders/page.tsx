import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth-guards";
import { getOrdersForUser } from "@/lib/order-query";
import { formatPrice } from "@/lib/money";
import { OrderStatusPill } from "@/components/account/order-status-pill";
import { AccountPagination } from "@/components/account/account-pagination";

export const metadata: Metadata = {
  title: "Order History",
};

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });
const MAX_THUMBNAILS = 4;

function firstSearchParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function OrdersPage({ searchParams }: PageProps<"/account/orders">) {
  const user = await requireUser();
  const raw = await searchParams;
  const requestedPage = Number.parseInt(firstSearchParam(raw.page) ?? "1", 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const { orders, pageCount } = await getOrdersForUser(user.id, page);

  return (
    <div>
      <h1 className="font-serif text-4xl text-bark">Orders</h1>

      {orders.length === 0 ? (
        <p className="mt-6 text-jute">You haven&rsquo;t placed an order yet.</p>
      ) : (
        <ul className="mt-8 space-y-4">
          {orders.map((order) => {
            const thumbnails = order.items.slice(0, MAX_THUMBNAILS);
            const overflow = order.items.length - thumbnails.length;

            return (
              <li key={order.id}>
                <Link
                  href={`/account/orders/${order.orderNumber}`}
                  className="flex flex-col gap-4 rounded-lg border border-hairline bg-cream p-4 transition-colors duration-200 ease-out hover:border-jute sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-3">
                      {thumbnails.map((item) => (
                        <div
                          key={item.id}
                          className="relative size-14 shrink-0 overflow-hidden rounded-md border-2 border-cream bg-jute/10"
                        >
                          {item.imageSnapshot && (
                            <Image
                              src={item.imageSnapshot}
                              alt=""
                              fill
                              sizes="56px"
                              className="object-cover"
                            />
                          )}
                        </div>
                      ))}
                      {overflow > 0 && (
                        <div className="relative flex size-14 shrink-0 items-center justify-center rounded-md border-2 border-cream bg-jute/10 text-xs font-medium text-jute">
                          +{overflow}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-bark">{order.orderNumber}</p>
                      <p className="text-sm text-jute">{dateFormatter.format(order.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-bark">{formatPrice(order.totalCents)}</span>
                    <OrderStatusPill status={order.status} />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <AccountPagination basePath="/account/orders" page={page} pageCount={pageCount} />
    </div>
  );
}
