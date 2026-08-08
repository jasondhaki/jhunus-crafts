import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth-guards";
import { getAdminOrders } from "@/lib/admin/order-query";
import { ORDER_STATUS_FILTERS, parseAdminOrderSearchParams } from "@/lib/admin/order-search-params";
import { formatPrice } from "@/lib/money";
import { cn } from "@/lib/utils";
import { OrderStatusPill } from "@/components/account/order-status-pill";
import { AdminOrdersPagination } from "@/components/admin/admin-orders-pagination";

export const metadata: Metadata = {
  title: "Orders",
};

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

function statusHref(status: string): string {
  return status === "all" ? "/admin/orders" : `/admin/orders?status=${status}`;
}

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  await requireAdmin();
  const raw = await searchParams;
  const params = parseAdminOrderSearchParams(raw);

  const { orders, pageCount } = await getAdminOrders(params.status, params.page);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-bark">Orders</h1>

      <div className="flex flex-wrap gap-1 rounded-md border border-gray-300 bg-white p-1">
        {ORDER_STATUS_FILTERS.map((status) => (
          <Link
            key={status}
            href={statusHref(status)}
            className={cn(
              "rounded px-3 py-1 text-sm font-medium transition-colors duration-200 ease-out",
              params.status === status ? "bg-terracotta text-cream" : "text-gray-600 hover:bg-gray-100",
            )}
          >
            {status === "all" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <p className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          No orders match this filter.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${order.orderNumber}`}
                      className="font-medium text-bark hover:text-terracotta"
                    >
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{order.email}</td>
                  <td className="px-4 py-3 text-gray-500">{dateFormatter.format(order.createdAt)}</td>
                  <td className="px-4 py-3 text-gray-700">{formatPrice(order.totalCents)}</td>
                  <td className="px-4 py-3">
                    <OrderStatusPill status={order.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AdminOrdersPagination params={params} pageCount={pageCount} />
    </div>
  );
}
