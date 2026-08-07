import { z } from "zod";

// Shared by the Credentials provider's authorize() and the login Server
// Action, so both agree on exactly what a "valid" credential shape is.
export const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export type CredentialsInput = z.infer<typeof credentialsSchema>;

// bcrypt silently truncates input past 72 bytes — cap password length so a
// long password doesn't create a false sense of extra entropy.
export const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.email(),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

export type RegisterInput = z.infer<typeof registerSchema>;
