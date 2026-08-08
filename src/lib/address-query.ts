import { db } from "@/lib/db";
import { shippingAddressSchema, type ShippingAddressInput } from "@/lib/checkout-schemas";

// There's no dedicated Address model in the schema (no CRUD address book
// was part of this task), so "Addresses" is derived, read-only: every
// distinct shipping address the user has actually checked out with,
// deduped and newest-first.
export async function getSavedAddressesForUser(userId: string): Promise<ShippingAddressInput[]> {
  const orders = await db.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { shippingAddr: true },
  });

  const seen = new Set<string>();
  const addresses: ShippingAddressInput[] = [];

  for (const order of orders) {
    const parsed = shippingAddressSchema.safeParse(order.shippingAddr);
    if (!parsed.success) continue;

    const key = JSON.stringify(parsed.data);
    if (seen.has(key)) continue;

    seen.add(key);
    addresses.push(parsed.data);
  }

  return addresses;
}
