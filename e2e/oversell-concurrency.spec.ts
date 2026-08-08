import { test, expect, type Browser } from "@playwright/test";
import { db } from "./db";
import { buildPaymentIntentSucceededPayload, E2E_STRIPE_WEBHOOK_SECRET, signStripeEvent } from "./helpers";

const PRODUCT_SLUG = "wanderers-twill-work-tote"; // seeded with stock: 1

async function browseAsSession(browser: Browser, slug: string) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`/shop/${slug}`);
  return { context, page };
}

test.describe("oversell attempt on a stock=1 product from two concurrent sessions", () => {
  test("only one of two simultaneous payment confirmations wins the last unit", async ({ browser }) => {
    const product = await db.product.findUniqueOrThrow({ where: { slug: PRODUCT_SLUG } });
    expect(product.stock).toBe(1);

    // Two distinct browser sessions both looking at the same one-of-a-kind
    // item — the realistic shape of the race this guards against.
    const sessionA = await browseAsSession(browser, PRODUCT_SLUG);
    const sessionB = await browseAsSession(browser, PRODUCT_SLUG);

    await expect(sessionA.page.getByRole("heading", { name: product.title })).toBeVisible();
    await expect(sessionB.page.getByRole("heading", { name: product.title })).toBeVisible();

    // Real Stripe test-mode credentials aren't available in this
    // environment (see e2e/README.md), so each session's checkout is
    // represented by a PENDING order with a real stripeIntentId — exactly
    // what /api/checkout produces before handing off to Stripe.js. The
    // race this test actually proves out is the one that matters: two
    // payment_intent.succeeded webhooks for the same product's last unit,
    // arriving concurrently, hitting the real atomic-decrement transaction.
    const orderA = await createPendingOrderFor(product, "session-a");
    const orderB = await createPendingOrderFor(product, "session-b");

    try {
      const [responseA, responseB] = await Promise.all([
        confirmPayment(sessionA, orderA),
        confirmPayment(sessionB, orderB),
      ]);

      // The webhook always acks 200 — even the loser, whose payment
      // succeeded (money moved) but whose order gets cancelled and
      // flagged for refund rather than silently oversold. See
      // src/app/api/webhooks/stripe/route.ts's OversellError path.
      expect(responseA.status()).toBe(200);
      expect(responseB.status()).toBe(200);

      const [finalOrderA, finalOrderB, finalProduct] = await Promise.all([
        db.order.findUniqueOrThrow({ where: { id: orderA.id } }),
        db.order.findUniqueOrThrow({ where: { id: orderB.id } }),
        db.product.findUniqueOrThrow({ where: { id: product.id } }),
      ]);

      const statuses = [finalOrderA.status, finalOrderB.status].sort();
      expect(statuses).toEqual(["CANCELLED", "PAID"]);

      // Stock must land at exactly 0 — never -1 (oversold) and never still
      // 1 (the winning order failed to actually decrement).
      expect(finalProduct.stock).toBe(0);
    } finally {
      await db.order.deleteMany({ where: { id: { in: [orderA.id, orderB.id] } } });
      await db.product.update({ where: { id: product.id }, data: { stock: product.stock } });
      await sessionA.context.close();
      await sessionB.context.close();
    }
  });
});

async function createPendingOrderFor(
  product: { id: string; priceCents: number; title: string; images: string[] },
  label: string,
) {
  return db.order.create({
    data: {
      orderNumber: `JC-OVER${label}${Date.now()}`,
      email: `oversell-${label}@example.com`,
      subtotalCents: product.priceCents,
      shippingCents: 500,
      totalCents: product.priceCents + 500,
      status: "PENDING",
      stripeIntentId: `pi_oversell_${label}_${Date.now()}`,
      shippingAddr: {
        fullName: "Oversell Test",
        line1: "1 Race Condition Way",
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
}

function confirmPayment(
  session: { page: import("@playwright/test").Page },
  order: { stripeIntentId: string | null },
) {
  const eventId = `evt_oversell_${order.stripeIntentId}`;
  const payload = buildPaymentIntentSucceededPayload(eventId, order.stripeIntentId!);
  const signature = signStripeEvent(payload, E2E_STRIPE_WEBHOOK_SECRET);

  return session.page.request.post("/api/webhooks/stripe", {
    headers: { "content-type": "application/json", "stripe-signature": signature },
    data: payload,
  });
}
