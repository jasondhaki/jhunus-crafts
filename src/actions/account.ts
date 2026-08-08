"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth-guards";
import {
  changePasswordSchema,
  DELETE_CONFIRMATION_PHRASE,
  deleteAccountSchema,
  updateNameSchema,
} from "@/lib/account-schemas";
import { signOut } from "../../auth";

export interface AccountActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: string;
}

// Guaranteed-invalid per RFC 2606, and distinguishable from any real
// customer email at a glance.
const ANONYMIZED_EMAIL = "deleted-account@anonymized.invalid";
const ANONYMIZED_ADDRESS = {
  fullName: "Deleted User",
  line1: "Redacted",
  city: "Redacted",
  state: "Redacted",
  postalCode: "00000",
  country: "US",
};

export async function updateNameAction(
  _prevState: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const user = await requireUser();
  const parsed = updateNameSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await db.user.update({ where: { id: user.id }, data: { name: parsed.data.name } });

  revalidatePath("/account");
  revalidatePath("/account/settings");
  return { success: "Name updated." };
}

export async function changePasswordAction(
  _prevState: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const user = await requireUser();
  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const dbUser = await db.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
  if (!dbUser?.passwordHash) {
    return { error: "This account signs in with Google and doesn't have a password to change." };
  }

  const currentMatches = await bcrypt.compare(parsed.data.currentPassword, dbUser.passwordHash);
  if (!currentMatches) {
    return { fieldErrors: { currentPassword: ["Current password is incorrect."] } };
  }

  const newHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await db.user.update({ where: { id: user.id }, data: { passwordHash: newHash } });

  return { success: "Password updated." };
}

export async function deleteAccountAction(
  _prevState: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const user = await requireUser();
  const parsed = deleteAccountSchema.safeParse({
    confirmation: formData.get("confirmation"),
    currentPassword: formData.get("currentPassword"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  if (parsed.data.confirmation !== DELETE_CONFIRMATION_PHRASE) {
    return {
      fieldErrors: { confirmation: [`Type "${DELETE_CONFIRMATION_PHRASE}" to confirm.`] },
    };
  }

  const dbUser = await db.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
  if (dbUser?.passwordHash) {
    const matches = await bcrypt.compare(parsed.data.currentPassword ?? "", dbUser.passwordHash);
    if (!matches) {
      return { fieldErrors: { currentPassword: ["Current password is incorrect."] } };
    }
  }

  // Orders are the financial/audit record and are never hard-deleted.
  // Anonymize their PII-bearing fields in place first, then delete the
  // user — Order.userId's onDelete: SetNull clears the FK automatically,
  // and Review.author is deliberately left untouched (see the schema
  // comment: it's stored redundantly precisely so reviews keep displaying
  // correctly after account deletion).
  await db.$transaction(async (tx) => {
    await tx.order.updateMany({
      where: { userId: user.id },
      data: { email: ANONYMIZED_EMAIL, phone: null, shippingAddr: ANONYMIZED_ADDRESS },
    });
    await tx.user.delete({ where: { id: user.id } });
  });

  await signOut({ redirectTo: "/" });
  return {};
}
