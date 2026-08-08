import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

// Needs the raw request body (for signature verification) and the Node
// Stripe SDK.
export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature or webhook secret." }, { status: 400 });
  }

  // Must read the raw body — constructEvent verifies the signature against
  // these exact bytes, so `request.json()` (which re-serializes) would
  // never match.
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed", error);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    await handlePaymentIntentSucceeded(event);
  }

  // Any other event type is acknowledged but ignored — we only act on the
  // one event that means "money actually moved."
  return NextResponse.json({ received: true });
}

async function handlePaymentIntentSucceeded(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  const orderId = paymentIntent.metadata.orderId;

  if (!orderId) {
    console.error("payment_intent.succeeded missing orderId metadata", paymentIntent.id);
    return;
  }

  await db.$transaction(async (tx) => {
    // Dedupe *inside* the same transaction as the mutations it guards —
    // Stripe retries on any non-2xx response, and this is what stops a
    // retried event from deducting stock twice (CLAUDE.md rule 3). If the
    // insert below conflicts, this event was already fully processed and
    // everything after it is skipped; if anything after it throws, the
    // insert itself rolls back too, so a genuinely failed attempt is still
    // eligible for Stripe's retry rather than being silently marked done.
    try {
      await tx.processedWebhookEvent.create({ data: { eventId: event.id, type: event.type } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return;
      }
      throw error;
    }

    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) {
      console.error("payment_intent.succeeded for unknown order", orderId);
      return;
    }

    // Belt-and-suspenders: even if the same order were ever reachable via
    // two different event IDs, never re-deduct stock for an order that's
    // already PAID.
    if (order.status === "PAID") {
      return;
    }

    for (const item of order.items) {
      // Atomic conditional decrement — never read-then-write. If two
      // orders somehow raced for the last unit, whichever webhook commits
      // first wins the stock; the loser's `count` comes back 0.
      const result = await tx.product.updateMany({
        where: { id: item.productId, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });

      if (result.count === 0) {
        // Oversold: the payment already succeeded (money has moved), but
        // stock couldn't be honored. Order still gets marked PAID below —
        // reversing a captured payment automatically here would need
        // business rules (refund vs. backorder) this task doesn't define,
        // so this is surfaced loudly for manual follow-up instead of
        // silently failing.
        console.error(
          `Order ${order.orderNumber}: could not deduct stock for product ${item.productId} (oversold). Manual review needed.`,
        );
      }
    }

    await tx.order.update({ where: { id: order.id }, data: { status: "PAID" } });
  });
}
