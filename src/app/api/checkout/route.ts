import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { checkoutRequestSchema } from "@/lib/checkout-schemas";
import { buildOrderDraft } from "@/lib/checkout-order";
import { getShippingMethod } from "@/lib/shipping";
import { generateOrderNumber } from "@/lib/order-number";
import { SITE_CURRENCY } from "@/lib/site-config";
import { auth } from "../../../../auth";

// Needs the Node.js `crypto` module (via order-number.ts) and the Stripe
// Node SDK — not Edge-compatible, and money logic has no business running
// anywhere but a real Node runtime.
export const runtime = "nodejs";

const MAX_ORDER_NUMBER_ATTEMPTS = 3;

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

  const session = await auth();

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

  await db.order.update({
    where: { id: order.id },
    data: { stripeIntentId: paymentIntent.id },
  });

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    orderNumber: order.orderNumber,
  });
}
