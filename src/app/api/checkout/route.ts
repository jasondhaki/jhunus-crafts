import { NextResponse } from "next/server";
import Stripe from "stripe";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { checkoutRequestSchema } from "@/lib/checkout-schemas";
import { buildOrderDraft } from "@/lib/checkout-order";
import { getShippingMethod } from "@/lib/shipping";
import { generateOrderNumber } from "@/lib/order-number";
import { SITE_CURRENCY } from "@/lib/site-config";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { auth } from "../../../../auth";

// Needs the Node.js `crypto` module (via order-number.ts) and the Stripe
// Node SDK — not Edge-compatible, and money logic has no business running
// anywhere but a real Node runtime.
export const runtime = "nodejs";

const MAX_ORDER_NUMBER_ATTEMPTS = 3;
const MAX_INTENT_LINK_ATTEMPTS = 3;

const TRANSIENT_DB_CODES = new Set(["P1001", "P1002", "P1008", "P1017"]);

function isTransientDbError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientInitializationError ||
    (error instanceof Prisma.PrismaClientKnownRequestError && TRANSIENT_DB_CODES.has(error.code))
  );
}

async function updateOrderStripeIntentWithRetry(
  orderId: string,
  orderNumber: string,
  paymentIntentId: string,
) {
  for (let attempt = 1; attempt <= MAX_INTENT_LINK_ATTEMPTS; attempt++) {
    try {
      await db.order.update({ where: { id: orderId }, data: { stripeIntentId: paymentIntentId } });
      return;
    } catch (error) {
      if (isTransientDbError(error) && attempt < MAX_INTENT_LINK_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, 100 * attempt));
        continue;
      }
      console.error(
        "CRITICAL: failed to link PaymentIntent to order after retries — Stripe has a live " +
          "PaymentIntent with no discoverable order; the webhook will find nothing when it " +
          "arrives. Needs manual reconciliation.",
        { orderId, orderNumber, paymentIntentId },
      );
      throw error;
    }
  }
}

async function createPendingOrder(
  input: {
    userId: string | undefined;
    email: string;
    phone: string | null;
    shippingAddr: Prisma.InputJsonValue;
    subtotalCents: number;
    shippingCents: number;
    totalCents: number;
    items: {
      productId: string;
      quantity: number;
      unitPriceCents: number;
      titleSnapshot: string;
      imageSnapshot: string | null;
    }[];
  },
) {
  for (let attempt = 1; attempt <= MAX_ORDER_NUMBER_ATTEMPTS; attempt++) {
    try {
      // A single Prisma `create` with nested `items.create` is one atomic
      // write — this *is* "inside a transaction" without needing an
      // explicit $transaction wrapper.
      return await db.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId: input.userId,
          email: input.email,
          phone: input.phone,
          shippingAddr: input.shippingAddr,
          subtotalCents: input.subtotalCents,
          shippingCents: input.shippingCents,
          totalCents: input.totalCents,
          status: "PENDING",
          items: { create: input.items },
        },
      });
    } catch (error) {
      const isOrderNumberCollision =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002" &&
        (error.meta?.target as string[] | undefined)?.includes("orderNumber");

      if (isOrderNumberCollision && attempt < MAX_ORDER_NUMBER_ATTEMPTS) {
        continue;
      }
      throw error;
    }
  }
  // Unreachable — the loop above always either returns or throws.
  throw new Error("Failed to create order");
}

export async function POST(request: Request) {
  // Checkout creates a real Stripe PaymentIntent and a DB row on every
  // call — cheap enough to abuse into either a Stripe API cost/rate-limit
  // problem or DB row spam. 10 attempts/minute per IP is generous for a
  // real shopper retrying a card, punishing for a script.
  const ip = await getClientIp();
  const { success: withinLimit } = rateLimit(`checkout:${ip}`, 10, 60_000);
  if (!withinLimit) {
    return NextResponse.json(
      { error: "Too many checkout attempts. Please wait a moment and try again." },
      { status: 429 },
    );
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = checkoutRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid checkout request.", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { items, email, shippingAddress, shippingMethodId } = parsed.data;

  const shippingMethod = getShippingMethod(shippingMethodId);
  if (!shippingMethod) {
    return NextResponse.json({ error: "Invalid shipping method." }, { status: 400 });
  }

  const session = await auth();

  // Everything below talks to two external systems (Postgres, Stripe) that
  // can each be down independently mid-checkout. Both failure modes are
  // classified explicitly and reported with a distinct, actionable message
  // instead of falling through to a generic 500 — per CLAUDE.md rule 9,
  // this still isn't a swallowed catch: anything not recognized here
  // rethrows to the default handler / error boundary.
  try {
    // Re-fetch every product from the database — the client sent IDs and
    // quantities only (never a price), per CLAUDE.md rules 1 & 2.
    const productIds = [...new Set(items.map((item) => item.productId))];
    const products = await db.product.findMany({ where: { id: { in: productIds } } });

    const draft = buildOrderDraft(items, products);
    if (!draft.ok) {
      // 409: the specific offending lines, so the UI can say e.g. "Jute
      // Market Tote is now sold out" instead of a generic failure.
      return NextResponse.json(
        { error: "Some items in your cart are no longer available.", lines: draft.issues },
        { status: 409 },
      );
    }

    const shippingCents = shippingMethod.cents;
    const totalCents = draft.subtotalCents + shippingCents;

    // Per CLAUDE.md rule 3: no stock deduction happens here. This only
    // reserves nothing and writes a PENDING order — stock moves exclusively
    // in the Stripe webhook once payment actually succeeds (rule 4).
    const order = await createPendingOrder({
      userId: session?.user?.id,
      email,
      phone: shippingAddress.phone || null,
      shippingAddr: shippingAddress,
      subtotalCents: draft.subtotalCents,
      shippingCents,
      totalCents,
      items: draft.items,
    });

    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: totalCents,
        currency: SITE_CURRENCY,
        automatic_payment_methods: { enabled: true },
        metadata: { orderId: order.id, orderNumber: order.orderNumber },
      },
      // Derived from the order id so a retried client request against the
      // same order can never create a second PaymentIntent.
      { idempotencyKey: `checkout_${order.id}` },
    );

    if (!paymentIntent.client_secret) {
      throw new Error(`PaymentIntent ${paymentIntent.id} was created without a client_secret`);
    }

    // This write is the only link between the PaymentIntent Stripe just
    // created (money is now, in effect, committed on Stripe's side) and
    // the order that's supposed to receive it — the webhook later looks
    // orders up by exactly this stripeIntentId. If it's lost, the webhook
    // finds nothing and the order silently never gets marked PAID. A short
    // bounded retry covers a DB blip; if it still fails, this is no longer
    // a "the user can just retry" situation — the specific IDs are logged
    // so it's discoverable and manually reconcilable.
    await updateOrderStripeIntentWithRetry(order.id, order.orderNumber, paymentIntent.id);

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      orderNumber: order.orderNumber,
    });
  } catch (error) {
    // StripeConnectionError: SDK couldn't reach Stripe at all (network/DNS/
    // TLS). StripeAPIError / StripeRateLimitError: Stripe reached but
    // failing on their end. All three mean "the outage is on Stripe's
    // side," which is a materially different message than "we're broken."
    if (
      error instanceof Stripe.errors.StripeConnectionError ||
      error instanceof Stripe.errors.StripeAPIError ||
      error instanceof Stripe.errors.StripeRateLimitError
    ) {
      return NextResponse.json(
        {
          error:
            "Payment processing is temporarily unavailable. Nothing has been charged — please try again in a few minutes.",
          code: "stripe_unavailable",
        },
        { status: 503 },
      );
    }

    // PrismaClientInitializationError: couldn't even open a connection.
    // P1001/P1002/P1008/P1017: reached Postgres but it dropped, refused, or
    // timed out mid-request — the "DB connection drops mid-checkout" case.
    if (isTransientDbError(error)) {
      return NextResponse.json(
        {
          error:
            "We couldn't reach our systems just now. Please try again in a moment — you have not been charged.",
          code: "db_unavailable",
        },
        { status: 503 },
      );
    }

    throw error;
  }
}
