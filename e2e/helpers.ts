import { createHmac } from "node:crypto";
import type { Page } from "@playwright/test";

// Matches prisma/seed.ts exactly.
export const SEEDED_ADMIN = { email: "admin@jhunuscrafts.com", password: "Admin123!Jute" };
export const SEEDED_CUSTOMER = { email: "customer@example.com", password: "Customer123!Jute" };

// Injected into the dev server Playwright drives (see playwright.config.ts's
// webServer.env) — never written to .env.local, never a real secret.
export const E2E_STRIPE_WEBHOOK_SECRET = "whsec_e2e_test_secret_do_not_use_in_prod";

export async function loginAs(page: Page, credentials: { email: string; password: string }) {
  await page.goto("/login");
  // { exact: true } — the footer's newsletter form (present on every page)
  // has an email input labeled "Email address", which a plain substring
  // match on "Email" also resolves to.
  await page.getByLabel("Email", { exact: true }).fill(credentials.email);
  await page.getByLabel("Password", { exact: true }).fill(credentials.password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(/\/(account|admin)/);
}

/**
 * Same HMAC-SHA256 scheme `stripe listen`/`stripe trigger` use to sign a
 * webhook request — documented and used the same way in the payments
 * phase's manual verification. Lets the webhook's real signature
 * verification be exercised without a Stripe CLI or live API keys.
 */
export function signStripeEvent(payload: string, secret: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
  return `t=${timestamp},v1=${signature}`;
}

export function buildPaymentIntentSucceededPayload(eventId: string, paymentIntentId: string): string {
  return JSON.stringify({
    id: eventId,
    type: "payment_intent.succeeded",
    data: { object: { id: paymentIntentId, amount: 0, currency: "usd" } },
  });
}
