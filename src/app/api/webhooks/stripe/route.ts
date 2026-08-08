import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

// Needs the raw request body (for signature verification) and the Node
// Stripe SDK — not Edge-compatible, and this is the single place money
// actually moves in this codebase, so it belongs on a real Node runtime.
export const runtime = "nodejs";

// Serializable is deliberately the strongest isolation level Postgres
// offers. This transaction decrements finite, one-of-a-kind stock and
// flips an order to PAID — a weaker level (e.g. Prisma's default
// ReadCommitted) could let two concurrent webhook deliveries for
// different orders both read "enough stock" for the same product before
// either commits its decrement. `timeout` bounds how long a single
// delivery can hold locks; `maxWait` bounds how long it waits to even
// acquire a connection to start.
const TRANSACTION_OPTIONS = {
  maxWait: 5000,
  timeout: 10000,
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
};

// Serializable isolation doesn't just prevent write skew — Postgres
// actively ABORTS one side of a genuine conflict with a serialization
// failure (Prisma surfaces this as P2034) and expects the *application* to
// retry. Found by actually running two payment_intent.succeeded webhooks
// concurrently for the same product's last unit (see
// e2e/oversell-concurrency.spec.ts): one transaction legitimately failed
// with "Transaction failed due to a write conflict or a deadlock," which
// — before this fix — fell through to the generic error handler and
// returned a bare 500, leaving that order's confirmation entirely up to
// Stripe's external retry schedule (which backs off to minutes, not
// milliseconds). A handful of immediate in-process retries resolves the
// overwhelmingly common case (the losing transaction almost always
// succeeds a moment later, once the winner has committed) without waiting
// on Stripe at all; if it's still conflicting after that, the existing
// outer catch's 500 is still the correct fallback.
async function withSerializableRetry<T>(fn: () => Promise<T>): Promise<T> {
  const MAX_ATTEMPTS = 3;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isSerializationConflict =
        error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";
      if (!isSerializationConflict || attempt === MAX_ATTEMPTS) {
        throw error;
      }
      // Small jittered delay so two retrying losers don't immediately
      // re-collide in lockstep.
      await new Promise((resolve) => setTimeout(resolve, 50 * attempt + Math.random() * 50));
    }
  }
  throw new Error("unreachable");
}

type LogOutcome =
  | "rejected_no_secret"
  | "invalid_signature"
  | "duplicate_skipped"
  | "claim_failed"
  | "order_not_found"
  | "already_paid_skipped"
  | "already_resolved_skipped"
  | "paid"
  | "oversold_cancelled"
  | "refund_stub_invoked"
  | "cancelled_payment_failed"
  | "skipped_never_paid"
  | "refunded_stock_restored"
  | "ignored"
  | "handler_error"
  | "claim_rollback_failed";

interface LogFields {
  eventId?: string;
  eventType?: string;
  orderNumber?: string;
  productId?: string;
  outcome: LogOutcome;
  detail?: string;
}

// Structured, single-line, greppable logs — identifiers only. Never the
// raw Stripe payload, the verification error's message (which can embed
// the signature header or body), card data, email, or shipping address.
function log(level: "info" | "warn" | "error", message: string, fields: LogFields) {
  const record = {
    level,
    message,
    ...fields,
    timestamp: new Date().toISOString(),
  };
  const line = JSON.stringify(record);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

// Thrown from inside the payment_intent.succeeded transaction to
// distinguish "this order was legitimately oversold" (a handled, terminal
// business outcome) from a genuinely unexpected failure (a DB blip, a bug)
// — the two need very different responses to Stripe.
class OversellError extends Error {
  constructor(
    readonly orderId: string,
    readonly orderNumber: string,
    readonly productId: string,
  ) {
    super(`Product ${productId} oversold for order ${orderNumber}`);
    this.name = "OversellError";
  }
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    log("error", "Missing Stripe signature header or STRIPE_WEBHOOK_SECRET is not configured", {
      outcome: "rejected_no_secret",
    });
    return NextResponse.json({ error: "Missing signature or webhook secret." }, { status: 400 });
  }

  // Must read the raw bytes — constructEvent verifies the signature
  // against exactly this body. request.json() re-serializes and would
  // never match, even for a legitimately-signed request.
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    // Deliberately don't log the caught error or the payload — Stripe's
    // SignatureVerificationError embeds the raw header and body in its
    // message, and rawBody may contain customer email/address.
    log("error", "Stripe webhook signature verification failed", { outcome: "invalid_signature" });
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  // Idempotency layer 1: claim this event id before doing any work. A
  // unique-constraint conflict means Stripe already delivered this exact
  // event (Stripe retries aggressively on anything but a fast 2xx) — ack
  // and stop immediately, no further reads or writes.
  try {
    await db.processedWebhookEvent.create({ data: { eventId: event.id, type: event.type } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      log("info", "Duplicate Stripe webhook event — already processed", {
        eventId: event.id,
        eventType: event.type,
        outcome: "duplicate_skipped",
      });
      return NextResponse.json({ received: true });
    }
    log("error", "Failed to record ProcessedWebhookEvent claim", {
      eventId: event.id,
      eventType: event.type,
      outcome: "claim_failed",
    });
    return NextResponse.json({ error: "Failed to record event." }, { status: 500 });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event);
        break;
      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event);
        break;
      case "charge.refunded":
        await handleChargeRefunded(event);
        break;
      default:
        // CLAUDE.md-adjacent rule for this route specifically: never 4xx
        // an event type we don't act on, or Stripe retries it forever.
        log("info", "Unhandled Stripe event type, acknowledged without action", {
          eventId: event.id,
          eventType: event.type,
          outcome: "ignored",
        });
    }
  } catch (error) {
    // Something genuinely unexpected (not the handled OversellError path,
    // which never reaches here). The event id claim from above is now a
    // landmine: left in place, it would permanently mark a
    // never-actually-processed event as "done" and swallow every future
    // Stripe retry for it. Roll it back so the next delivery gets a clean
    // attempt, then return 500 so Stripe retries soon rather than waiting
    // for its default backoff.
    await db.processedWebhookEvent.delete({ where: { eventId: event.id } }).catch(() => {
      log("error", "Failed to roll back ProcessedWebhookEvent claim after handler error — event may be stuck", {
        eventId: event.id,
        eventType: event.type,
        outcome: "claim_rollback_failed",
      });
    });

    log("error", "Unhandled error processing Stripe webhook event", {
      eventId: event.id,
      eventType: event.type,
      outcome: "handler_error",
      detail: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Internal error processing webhook." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handlePaymentIntentSucceeded(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;

  try {
    await withSerializableRetry(() =>
      db.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
          where: { stripeIntentId: paymentIntent.id },
          include: { items: true },
        });

        if (!order) {
          // A PaymentIntent with no matching order is unrecoverable —
          // retrying will never make the order appear. Log loudly, commit
          // nothing, and the caller acks 200 so Stripe stops retrying.
          log("error", "payment_intent.succeeded for a PaymentIntent with no matching order", {
            eventId: event.id,
            eventType: event.type,
            detail: paymentIntent.id,
            outcome: "order_not_found",
          });
          return;
        }

        if (order.status === "PAID") {
          // Second layer of idempotency, independent of the event-id claim
          // above — belt and suspenders against ever re-deducting stock
          // for an order that's already fulfilled its payment.
          log("info", "payment_intent.succeeded for an already-PAID order", {
            eventId: event.id,
            eventType: event.type,
            orderNumber: order.orderNumber,
            outcome: "already_paid_skipped",
          });
          return;
        }

        for (const item of order.items) {
          // Atomic conditional decrement — never read-then-write. Exactly
          // one row can match this `where` (id is the primary key), so
          // `count` is either 1 (decremented) or 0 (oversold).
          const result = await tx.product.updateMany({
            where: { id: item.productId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });

          if (result.count !== 1) {
            throw new OversellError(order.id, order.orderNumber, item.productId);
          }
        }

        await tx.order.update({ where: { id: order.id }, data: { status: "PAID" } });

        log("info", "Order marked PAID and stock deducted", {
          eventId: event.id,
          eventType: event.type,
          orderNumber: order.orderNumber,
          outcome: "paid",
        });
      }, TRANSACTION_OPTIONS),
    );
  } catch (error) {
    if (error instanceof OversellError) {
      // The transaction above has already rolled back in full — no
      // partial stock decrement survived. Money has moved (Stripe already
      // captured payment) but we cannot fulfil this order as sold, so it
      // must never silently ship: cancel it, log CRITICAL for a human,
      // and kick off a refund.
      log("error", "CRITICAL: order oversold between checkout and payment — cancelling and flagging for refund", {
        eventId: event.id,
        eventType: event.type,
        orderNumber: error.orderNumber,
        productId: error.productId,
        outcome: "oversold_cancelled",
      });

      await db.order.update({ where: { id: error.orderId }, data: { status: "CANCELLED" } });
      await triggerRefund(event, paymentIntent, error.orderNumber);
      return;
    }
    throw error;
  }
}

// Stub: production would call `stripe.refunds.create({ payment_intent })`
// here and persist the resulting refund id on the order. Left as a stub —
// the actual business rules (full vs. partial refund, automatic customer
// notification vs. routing to a human) aren't defined by this task.
async function triggerRefund(event: Stripe.Event, paymentIntent: Stripe.PaymentIntent, orderNumber: string) {
  log("warn", "STUB: refund would be triggered here", {
    eventId: event.id,
    eventType: event.type,
    orderNumber,
    detail: paymentIntent.id,
    outcome: "refund_stub_invoked",
  });
}

async function handlePaymentIntentFailed(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;

  const order = await db.order.findUnique({ where: { stripeIntentId: paymentIntent.id } });
  if (!order) {
    log("error", "payment_intent.payment_failed for a PaymentIntent with no matching order", {
      eventId: event.id,
      eventType: event.type,
      detail: paymentIntent.id,
      outcome: "order_not_found",
    });
    return;
  }

  if (order.status === "PAID" || order.status === "CANCELLED") {
    log("info", "payment_intent.payment_failed for an order already resolved", {
      eventId: event.id,
      eventType: event.type,
      orderNumber: order.orderNumber,
      outcome: "already_resolved_skipped",
    });
    return;
  }

  // No stock movement — a failed PaymentIntent never reached
  // payment_intent.succeeded, so nothing was ever decremented.
  await db.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });

  log("info", "Order cancelled after payment failure, no stock movement", {
    eventId: event.id,
    eventType: event.type,
    orderNumber: order.orderNumber,
    outcome: "cancelled_payment_failed",
  });
}

async function handleChargeRefunded(event: Stripe.Event) {
  const charge = event.data.object as Stripe.Charge;
  const paymentIntentId =
    typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;

  if (!paymentIntentId) {
    log("error", "charge.refunded with no associated PaymentIntent id", {
      eventId: event.id,
      eventType: event.type,
      outcome: "order_not_found",
    });
    return;
  }

  await withSerializableRetry(() =>
    db.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { stripeIntentId: paymentIntentId },
        include: { items: true },
      });

      if (!order) {
        log("error", "charge.refunded for a PaymentIntent with no matching order", {
          eventId: event.id,
          eventType: event.type,
          detail: paymentIntentId,
          outcome: "order_not_found",
        });
        return;
      }

      if (order.status !== "PAID") {
        // Only a PAID order ever had stock deducted — restoring stock for
        // one that didn't (already CANCELLED, or somehow still PENDING)
        // would incorrectly inflate inventory.
        log("info", "charge.refunded for an order that was never PAID — skipping stock restore", {
          eventId: event.id,
          eventType: event.type,
          orderNumber: order.orderNumber,
          outcome: "skipped_never_paid",
        });
        return;
      }

      for (const item of order.items) {
        // The inverse of the atomic decrement above — no `gte` guard
        // needed on the way back up, since incrementing can't oversell.
        await tx.product.updateMany({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }

      await tx.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });

      log("info", "Order cancelled and stock restored after refund", {
        eventId: event.id,
        eventType: event.type,
        orderNumber: order.orderNumber,
        outcome: "refunded_stock_restored",
      });
    }, TRANSACTION_OPTIONS),
  );
}
