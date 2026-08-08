import { forbidden, redirect } from "next/navigation";
import { auth } from "../../auth";

/**
 * Reads the session server-side and redirects to /login if there isn't one.
 * Middleware already protects /account and /admin, but Server Actions can
 * be invoked directly (bypassing route middleware entirely), so every
 * action that needs a signed-in user must call this itself.
 */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session.user;
}

/**
 * Per CLAUDE.md rule 7: every /admin route and every admin Server Action
 * independently re-checks the ADMIN role server-side. Middleware and
 * hidden UI are conveniences, not security.
 */
export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    forbidden();
  }
  return user;
}
