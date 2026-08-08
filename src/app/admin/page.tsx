import Link from "next/link";
import { AlertTriangle, DollarSign, ShoppingBag, Star } from "lucide-react";
import { requireAdmin } from "@/lib/auth-guards";
import { getDashboardStats, LOW_STOCK_THRESHOLD } from "@/lib/admin/dashboard-query";
import { formatPrice } from "@/lib/money";
import { cn } from "@/lib/utils";
import { StatCard } from "@/components/admin/stat-card";
import { OrderStatusPill } from "@/components/account/order-status-pill";

export const metadata = {
  title: "Admin Dashboard",
};

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

export default async function AdminDashboardPage() {
  // Independently re-checks ADMIN (see layout.tsx's comment — this is
  // deliberate belt-and-suspenders per CLAUDE.md rule 7, not redundancy
  // for its own sake) and gives this page its own session.user for the
  // greeting.
  const user = await requireAdmin();
  const stats = await getDashboardStats();

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Admin</p>
        <h1 className="mt-1 text-2xl font-semibold text-bark">Welcome back, {user.name ?? user.email}</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Revenue This Month"
          value={formatPrice(stats.revenueThisMonthCents)}
          icon={DollarSign}
          accent
        />
        <StatCard label="Orders This Month" value={String(stats.ordersThisMonth)} icon={ShoppingBag} />
        <StatCard
          label="Low Stock"
          value={String(stats.lowStockCount)}
          icon={AlertTriangle}
          accent={stats.lowStockCount > 0}
        />
        <StatCard
          label="Pending Reviews"
          value={String(stats.pendingReviewCount)}
          icon={Star}
          accent={stats.pendingReviewCount > 0}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="rounded-lg border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-bark">Recent Orders</h2>
            <Link href="/admin/orders" className="text-xs font-medium text-terracotta hover:opacity-70">
              View all
            </Link>
          </div>
          {stats.recentOrders.length === 0 ? (
            <p className="p-4 text-sm text-gray-500">No orders yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                    <th className="px-4 py-2 font-medium">Order</th>
                    <th className="px-4 py-2 font-medium">Date</th>
                    <th className="px-4 py-2 font-medium">Total</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stats.recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-4 py-2.5">
                        <Link
                          href={`/admin/orders/${order.orderNumber}`}
                          className="font-medium text-bark hover:text-terracotta"
                        >
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 text-gray-500">{dateFormatter.format(order.createdAt)}</td>
                      <td className="px-4 py-2.5 text-gray-700">{formatPrice(order.totalCents)}</td>
                      <td className="px-4 py-2.5">
                        <OrderStatusPill status={order.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-bark">Low Stock Alert</h2>
            <p className="text-xs text-gray-500">Active products at {LOW_STOCK_THRESHOLD} units or fewer.</p>
          </div>
          {stats.lowStockProducts.length === 0 ? (
            <p className="p-4 text-sm text-gray-500">Nothing low on stock.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {stats.lowStockProducts.map((product) => (
                <li key={product.id}>
                  <Link
                    href={`/admin/products/${product.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm transition-colors duration-200 ease-out hover:bg-gray-50"
                  >
                    <span className="text-bark">{product.title}</span>
                    <span className={cn("font-medium", product.stock === 0 ? "text-red-600" : "text-terracotta")}>
                      {product.stock} left
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
