import { z } from "zod";

export const updateNameSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
});

// bcrypt silently truncates input past 72 bytes, same reasoning as
// registerSchema in auth-schemas.ts.
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters").max(72),
});

export const DELETE_CONFIRMATION_PHRASE = "DELETE";

export const deleteAccountSchema = z.object({
  confirmation: z.string(),
  // Optional at the schema level — OAuth-only accounts have no password to
  // check. The action itself still requires it whenever a passwordHash
  // exists.
  currentPassword: z.string().optional().or(z.literal("")),
});
