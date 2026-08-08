import { test, expect } from "@playwright/test";
import { db } from "./db";
import { buildPaymentIntentSucceededPayload, E2E_STRIPE_WEBHOOK_SECRET, signStripeEvent } from "./helpers";

// This environment has no real Stripe test-mode credentials, so it cannot
// complete a real card payment — Stripe.js itself needs a real
// publishable key to even initialize the Payment Element. The spec below
// is split into the two halves that ARE genuinely testable against real
// code with no mocking:
//
//   1. The actual checkout UI, through the real /api/checkout route,
//      confirming it fails predictably (not a crash) when PaymentIntent
//      creation can't complete — real client + real server, real DB
//      round trip up to the Stripe API boundary.
//   2. The real webhook handler — signature verification, the atomic
//      stock-decrement transaction, and the PAID transition — driven
//      against a PENDING order with a real stripeIntentId, the same shape
//      a successful /api/checkout call would have produced. This is
//      where the actual "→ order PAID" guarantee lives, and it's fully
//      exercisable without a live Stripe account.
//
// See e2e/README.md for the full reasoning.

test.describe("guest checkout → webhook → order PAID", () => {
  test("checkout submission reaches the real API and fails predictably without live Stripe credentials", async ({
    page,
  }) => {
    await page.goto("/shop/heirloom-herringbone-market-tote");
    await page.getByRole("button", { name: "Add to Cart" }).click();
    await page.getByRole("dialog", { name: "Shopping cart" }).getByRole("link", { name: "Checkout" }).click();
    await expect(page).toHaveURL(/\/checkout$/);

    // { exact: true } matters here — the footer's newsletter signup form
    // (rendered on every page, including /checkout) has an email input
    // labeled "Email address", which a plain substring match on "Email"
    // also resolves to.
    await page.getByLabel("Email", { exact: true }).fill(`e2e-${Date.now()}@example.com`);
    await page.getByLabel("Full Name").fill("E2E Test Shopper");
    await page.getByLabel("Street Address").fill("123 Playwright Ave");
    await page.getByLabel("City").fill("Austin");
    await page.getByLabel("State").fill("TX");
    await page.getByLabel("Postal Code").fill("78701");
    await page.getByRole("radio", { name: /Standard Shipping/ }).check();
    await page.getByRole("button", { name: "Continue to Payment" }).click();

    // The route validates the cart, recomputes totals, and creates the
    // PENDING order successfully — it only fails at the Stripe API call,
    // which the client surfaces as a generic (not a crash/blank-page) error.
    await expect(page.getByText(/went wrong/i)).toBeVisible({ timeout: 10_000 });
  });

  test("webhook marks a PENDING order PAID and atomically deducts stock", async ({ request }) => {
    const product = await db.product.findUniqueOrThrow({
      where: { slug: "sundrift-flat-braid-beach-tote" },
    });
    const stockBefore = product.stock;

    const order = await db.order.create({
      data: {
        orderNumber: `JC-E2E${Date.now()}`,
        email: "webhook-e2e@example.com",
        subtotalCents: product.priceCents,
        shippingCents: 500,
        totalCents: product.priceCents + 500,
        status: "PENDING",
        stripeIntentId: `pi_e2e_${Date.now()}`,
        shippingAddr: {
          fullName: "Webhook E2E",
          line1: "1 Test St",
          city: "Austin",
          state: "TX",
          postalCode: "78701",
          country: "US",
        },
        items: {
          create: [
            {
              productId: product.id,
              quantity: 1,
              unitPriceCents: product.priceCents,
              titleSnapshot: product.title,
              imageSnapshot: product.images[0] ?? null,
            },
          ],
        },
      },
    });

    try {
      const eventId = `evt_e2e_${Date.now()}`;
      const payload = buildPaymentIntentSucceededPayload(eventId, order.stripeIntentId!);
      const signature = signStripeEvent(payload, E2E_STRIPE_WEBHOOK_SECRET);

      const response = await request.post("/api/webhooks/stripe", {
        headers: { "content-type": "application/json", "stripe-signature": signature },
        data: payload,
      });

      expect(response.status()).toBe(200);

      const paidOrder = await db.order.findUniqueOrThrow({ where: { id: order.id } });
      expect(paidOrder.status).toBe("PAID");

      const productAfter = await db.product.findUniqueOrThrow({ where: { id: product.id } });
      expect(productAfter.stock).toBe(stockBefore - 1);

      // Replaying the identical event must not deduct stock a second time.
      const replaySignature = signStripeEvent(payload, E2E_STRIPE_WEBHOOK_SECRET);
      const replay = await request.post("/api/webhooks/stripe", {
        headers: { "content-type": "application/json", "stripe-signature": replaySignature },
        data: payload,
      });
      expect(replay.status()).toBe(200);

      const productAfterReplay = await db.product.findUniqueOrThrow({ where: { id: product.id } });
      expect(productAfterReplay.stock).toBe(stockBefore - 1);
    } finally {
      await db.order.delete({ where: { id: order.id } });
      await db.product.update({ where: { id: product.id }, data: { stock: stockBefore } });
    }
  });
});
