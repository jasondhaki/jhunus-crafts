import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";

const { mockTx, mockDb } = vi.hoisted(() => {
  const mockTx = {
    order: { findUnique: vi.fn(), update: vi.fn() },
    product: { updateMany: vi.fn() },
  };
  const mockDb = {
    processedWebhookEvent: { create: vi.fn(), delete: vi.fn() },
    order: { findUnique: vi.fn(), update: vi.fn() },
    $transaction: vi.fn(async (fn: (tx: typeof mockTx) => unknown) => fn(mockTx)),
  };
  return { mockTx, mockDb };
});

const { constructEventMock } = vi.hoisted(() => ({ constructEventMock: vi.fn() }));

vi.mock("@/lib/db", () => ({ db: mockDb }));
vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({ webhooks: { constructEvent: constructEventMock } }),
}));

const { POST } = await import("./route");

function buildRequest(body: string, signature: string | null = "t=1,v1=valid"): Request {
  const headers: Record<string, string> = {};
  if (signature !== null) headers["stripe-signature"] = signature;
  return new Request("http://localhost/api/webhooks/stripe", {
    method: "POST",
    headers,
    body,
  });
}

function stripeEvent(type: string, object: Record<string, unknown>, id = "evt_test_1") {
  return { id, type, data: { object } };
}

function order(overrides: Record<string, unknown> = {}) {
  return {
    id: "order_1",
    orderNumber: "JC-TESTORDR",
    status: "PENDING",
    items: [{ productId: "prod_1", quantity: 2 }],
    ...overrides,
  };
}

const RAW_BODY = JSON.stringify({ type: "payment_intent.succeeded" });

beforeEach(() => {
  vi.clearAllMocks();
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_secret";
  mockDb.$transaction.mockImplementation(async (fn: (tx: typeof mockTx) => unknown) => fn(mockTx));
});

describe("POST /api/webhooks/stripe", () => {
  it("returns 400 and does no work when the signature header is missing", async () => {
    const response = await POST(buildRequest(RAW_BODY, null));

    expect(response.status).toBe(400);
    expect(constructEventMock).not.toHaveBeenCalled();
    expect(mockDb.processedWebhookEvent.create).not.toHaveBeenCalled();
  });

  it("returns 400 and does no work when signature verification fails", async () => {
    constructEventMock.mockImplementation(() => {
      throw new Error("No signatures found matching the expected signature for payload");
    });

    const response = await POST(buildRequest(RAW_BODY, "t=1,v1=bogus"));

    expect(response.status).toBe(400);
    expect(mockDb.processedWebhookEvent.create).not.toHaveBeenCalled();
  });

  it("short-circuits with 200 and does nothing else on a duplicate event id", async () => {
    constructEventMock.mockReturnValue(
      stripeEvent("payment_intent.succeeded", { id: "pi_1" }, "evt_dup"),
    );
    mockDb.processedWebhookEvent.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "test",
      }),
    );

    const response = await POST(buildRequest(RAW_BODY));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ received: true });
    expect(mockDb.$transaction).not.toHaveBeenCalled();
    expect(mockTx.product.updateMany).not.toHaveBeenCalled();
  });

  it("returns 200 for an unhandled event type without touching the database beyond the claim", async () => {
    constructEventMock.mockReturnValue(stripeEvent("charge.dispute.created", { id: "ch_1" }));
    mockDb.processedWebhookEvent.create.mockResolvedValue({});

    const response = await POST(buildRequest(RAW_BODY));

    expect(response.status).toBe(200);
    expect(mockDb.$transaction).not.toHaveBeenCalled();
  });

  describe("payment_intent.succeeded", () => {
    it("deducts stock for every line and marks the order PAID on success", async () => {
      constructEventMock.mockReturnValue(
        stripeEvent("payment_intent.succeeded", { id: "pi_ok" }, "evt_ok"),
      );
      mockDb.processedWebhookEvent.create.mockResolvedValue({});
      mockTx.order.findUnique.mockResolvedValue(order());
      mockTx.product.updateMany.mockResolvedValue({ count: 1 });

      const response = await POST(buildRequest(RAW_BODY));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({ received: true });
      expect(mockTx.product.updateMany).toHaveBeenCalledWith({
        where: { id: "prod_1", stock: { gte: 2 } },
        data: { stock: { decrement: 2 } },
      });
      expect(mockTx.order.update).toHaveBeenCalledWith({
        where: { id: "order_1" },
        data: { status: "PAID" },
      });
      // Never rolled back on the happy path.
      expect(mockDb.processedWebhookEvent.delete).not.toHaveBeenCalled();
    });

    it("short-circuits without touching stock when the order is already PAID", async () => {
      constructEventMock.mockReturnValue(
        stripeEvent("payment_intent.succeeded", { id: "pi_paid" }, "evt_paid"),
      );
      mockDb.processedWebhookEvent.create.mockResolvedValue({});
      mockTx.order.findUnique.mockResolvedValue(order({ status: "PAID" }));

      const response = await POST(buildRequest(RAW_BODY));

      expect(response.status).toBe(200);
      expect(mockTx.product.updateMany).not.toHaveBeenCalled();
      expect(mockTx.order.update).not.toHaveBeenCalled();
    });

    it("rolls back, cancels the order, and never marks it PAID when a line is oversold", async () => {
      constructEventMock.mockReturnValue(
        stripeEvent("payment_intent.succeeded", { id: "pi_oversold" }, "evt_oversold"),
      );
      mockDb.processedWebhookEvent.create.mockResolvedValue({});
      mockTx.order.findUnique.mockResolvedValue(order());
      // count: 0 means the conditional `stock >= quantity` update matched
      // nothing — the item sold out between checkout and payment.
      mockTx.product.updateMany.mockResolvedValue({ count: 0 });
      mockDb.order.update.mockResolvedValue({});

      const response = await POST(buildRequest(RAW_BODY));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({ received: true });
      // The transaction's own order.update (which would set PAID) must
      // never have been called — only the outside-the-transaction cancel.
      expect(mockTx.order.update).not.toHaveBeenCalled();
      expect(mockDb.order.update).toHaveBeenCalledWith({
        where: { id: "order_1" },
        data: { status: "CANCELLED" },
      });
      // The event-id claim was NOT rolled back — this is a handled,
      // terminal outcome, not a failure that should let Stripe retry.
      expect(mockDb.processedWebhookEvent.delete).not.toHaveBeenCalled();
    });

    it("logs loudly and acks 200 when no order matches the PaymentIntent", async () => {
      constructEventMock.mockReturnValue(
        stripeEvent("payment_intent.succeeded", { id: "pi_orphan" }, "evt_orphan"),
      );
      mockDb.processedWebhookEvent.create.mockResolvedValue({});
      mockTx.order.findUnique.mockResolvedValue(null);

      const response = await POST(buildRequest(RAW_BODY));

      expect(response.status).toBe(200);
      expect(mockTx.product.updateMany).not.toHaveBeenCalled();
    });

    it("rolls back the event-id claim and returns 500 on a genuinely unexpected error", async () => {
      constructEventMock.mockReturnValue(
        stripeEvent("payment_intent.succeeded", { id: "pi_crash" }, "evt_crash"),
      );
      mockDb.processedWebhookEvent.create.mockResolvedValue({});
      mockTx.order.findUnique.mockRejectedValue(new Error("connection reset"));
      mockDb.processedWebhookEvent.delete.mockResolvedValue({});

      const response = await POST(buildRequest(RAW_BODY));

      expect(response.status).toBe(500);
      expect(mockDb.processedWebhookEvent.delete).toHaveBeenCalledWith({
        where: { eventId: "evt_crash" },
      });
    });
  });

  describe("payment_intent.payment_failed", () => {
    it("cancels the order with no stock movement", async () => {
      constructEventMock.mockReturnValue(
        stripeEvent("payment_intent.payment_failed", { id: "pi_failed" }, "evt_failed"),
      );
      mockDb.processedWebhookEvent.create.mockResolvedValue({});
      mockDb.order.findUnique.mockResolvedValue(order());
      mockDb.order.update.mockResolvedValue({});

      const response = await POST(buildRequest(RAW_BODY));

      expect(response.status).toBe(200);
      expect(mockDb.order.update).toHaveBeenCalledWith({
        where: { id: "order_1" },
        data: { status: "CANCELLED" },
      });
      expect(mockTx.product.updateMany).not.toHaveBeenCalled();
    });
  });

  describe("charge.refunded", () => {
    it("restores stock for a previously PAID order and cancels it", async () => {
      constructEventMock.mockReturnValue(
        stripeEvent("charge.refunded", { id: "ch_1", payment_intent: "pi_refunded" }, "evt_refund"),
      );
      mockDb.processedWebhookEvent.create.mockResolvedValue({});
      mockTx.order.findUnique.mockResolvedValue(order({ status: "PAID" }));

      const response = await POST(buildRequest(RAW_BODY));

      expect(response.status).toBe(200);
      expect(mockTx.product.updateMany).toHaveBeenCalledWith({
        where: { id: "prod_1" },
        data: { stock: { increment: 2 } },
      });
      expect(mockTx.order.update).toHaveBeenCalledWith({
        where: { id: "order_1" },
        data: { status: "CANCELLED" },
      });
    });

    it("does not restore stock for an order that was never PAID", async () => {
      constructEventMock.mockReturnValue(
        stripeEvent("charge.refunded", { id: "ch_2", payment_intent: "pi_never_paid" }, "evt_refund2"),
      );
      mockDb.processedWebhookEvent.create.mockResolvedValue({});
      mockTx.order.findUnique.mockResolvedValue(order({ status: "CANCELLED" }));

      const response = await POST(buildRequest(RAW_BODY));

      expect(response.status).toBe(200);
      expect(mockTx.product.updateMany).not.toHaveBeenCalled();
      expect(mockTx.order.update).not.toHaveBeenCalled();
    });
  });
});
