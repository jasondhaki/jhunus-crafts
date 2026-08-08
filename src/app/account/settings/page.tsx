import type { Metadata } from "next";
import { requireUser } from "@/lib/auth-guards";
import { db } from "@/lib/db";
import { UpdateNameForm } from "@/components/account/update-name-form";
import { ChangePasswordForm } from "@/components/account/change-password-form";
import { DeleteAccountForm } from "@/components/account/delete-account-form";

export const metadata: Metadata = {
  title: "Account Settings",
};

export default async function SettingsPage() {
  const user = await requireUser();
  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: { name: true, email: true, passwordHash: true },
  });

  const hasPassword = !!dbUser?.passwordHash;

  return (
    <div className="space-y-12">
      <div>
        <h1 className="font-serif text-4xl text-bark">Settings</h1>
        <p className="mt-2 text-jute">{dbUser?.email}</p>
      </div>

      <section className="max-w-md space-y-4">
        <h2 className="font-serif text-xl text-bark">Profile</h2>
        <UpdateNameForm initialName={dbUser?.name ?? ""} />
      </section>

      {hasPassword && (
        <section className="max-w-md space-y-4">
          <h2 className="font-serif text-xl text-bark">Password</h2>
          <ChangePasswordForm />
        </section>
      )}

      <section className="max-w-md space-y-4 rounded-lg border border-red-200 bg-red-50/50 p-6">
        <h2 className="font-serif text-xl text-red-700">Danger Zone</h2>
        <p className="text-sm text-jute">
          Deleting your account removes your saved details and wishlist. Your past orders are kept
          for financial records, with personal details anonymized.
        </p>
        <DeleteAccountForm hasPassword={hasPassword} />
      </section>
    </div>
  );
}
