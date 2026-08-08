"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { credentialsSchema, registerSchema } from "@/lib/auth-schemas";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { signIn, signOut } from "../../auth";

export interface FormActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export async function loginAction(
  callbackUrl: string | undefined,
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  // Credential stuffing / brute force target — 5 attempts/minute per IP
  // is enough for a real person fumbling a password, not for a script.
  const ip = await getClientIp();
  const { success: withinLimit } = rateLimit(`login:${ip}`, 5, 60_000);
  if (!withinLimit) {
    return { error: "Too many sign-in attempts. Please wait a minute and try again." };
  }

  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Enter a valid email and password." };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: callbackUrl || "/account",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw error;
  }

  return {};
}

export async function registerAction(
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  // Prevents scripted mass account creation (and the bcrypt-hash CPU cost
  // that comes with each attempt) — 5 accounts/minute per IP.
  const ip = await getClientIp();
  const { success: withinLimit } = rateLimit(`register:${ip}`, 5, 60_000);
  if (!withinLimit) {
    return { error: "Too many attempts. Please wait a minute and try again." };
  }

  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { name, email, password } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 12);

  try {
    await db.user.create({
      data: { name, email, passwordHash, role: "CUSTOMER" },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      // Deliberately generic — don't confirm that this specific email is
      // the one already registered.
      return {
        error: "Something went wrong. If you already have an account, try signing in instead.",
      };
    }
    throw error;
  }

  try {
    await signIn("credentials", { email, password, redirectTo: "/account" });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Account created — please sign in." };
    }
    throw error;
  }

  return {};
}

export async function signInWithGoogleAction() {
  await signIn("google", { redirectTo: "/account" });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
