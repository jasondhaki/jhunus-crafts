import type { Metadata } from "next";
import { requireUser } from "@/lib/auth-guards";
import { getSavedAddressesForUser } from "@/lib/address-query";

export const metadata: Metadata = {
  title: "Addresses",
};

export default async function AddressesPage() {
  const user = await requireUser();
  const addresses = await getSavedAddressesForUser(user.id);

  return (
    <div>
      <h1 className="font-serif text-4xl text-bark">Addresses</h1>
      <p className="mt-2 max-w-xl text-sm text-jute">
        There isn&rsquo;t a separate address book yet, so this is every distinct shipping address
        you&rsquo;ve used at checkout, most recent first.
      </p>

      {addresses.length === 0 ? (
        <p className="mt-8 text-jute">
          No saved addresses yet — they&rsquo;ll appear here after your first order.
        </p>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {addresses.map((address, index) => (
            <li key={index} className="rounded-lg border border-hairline bg-cream p-4 text-sm text-jute">
              <p className="font-medium text-bark">{address.fullName}</p>
              <p>{address.line1}</p>
              {address.line2 && <p>{address.line2}</p>}
              <p>
                {address.city}, {address.state} {address.postalCode}
              </p>
              <p>{address.country}</p>
              {address.phone && <p>{address.phone}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
