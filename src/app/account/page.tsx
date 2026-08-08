import Link from "next/link";
import type { ComponentType } from "react";
import { Heart, Package, Settings } from "lucide-react";
import { requireUser } from "@/lib/auth-guards";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/money";
import { OrderStatusPill } from "@/components/account/order-status-pill";

export const metadata = {
  title: "My Account",
};

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

export default async function AccountPage() {
  const user = await requireUser();

  const [recentOrders, wishlistCount] = await Promise.all([
    db.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    db.wishlistItem.count({ where: { userId: user.id } }),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-jute">My Account</p>
        <h1 className="mt-2 font-serif text-4xl text-bark">
          Welcome back, {user.name ?? user.email}
        </h1>
      </div>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl text-bark">Recent Orders</h2>
          <Link
            href="/account/orders"
            className="text-sm font-medium text-terracotta transition-opacity duration-200 ease-out hover:opacity-70"
          >
            View all
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="mt-4 text-jute">You haven&rsquo;t placed an order yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-hairline rounded-lg border border-hairline bg-cream">
            {recentOrders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/account/orders/${order.orderNumber}`}
                  className="flex items-center justify-between gap-4 p-4 transition-colors duration-200 ease-out hover:bg-jute/5"
                >
                  <div>
                    <p className="font-medium text-bark">{order.orderNumber}</p>
                    <p className="text-sm text-jute">{dateFormatter.format(order.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-bark">{formatPrice(order.totalCents)}</span>
                    <OrderStatusPill status={order.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <QuickAction href="/account/orders" icon={Package} label="Order History" />
        <QuickAction href="/account/wishlist" icon={Heart} label={`Wishlist (${wishlistCount})`} />
        <QuickAction href="/account/settings" icon={Settings} label="Account Settings" />
      </section>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg border border-hairline bg-cream p-4 transition-colors duration-200 ease-out hover:border-jute"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-terracotta/10 text-terracotta">
        <Icon className="size-5" aria-hidden={true} />
      </span>
      <span className="font-medium text-bark">{label}</span>
    </Link>
  );
}
