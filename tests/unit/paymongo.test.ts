import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { parseEvent, verifySignature } from "@/features/billing/paymongo";

const SECRET = "whsk_unit_test_secret";
const sig = (body: string, secret = SECRET, t = "1700000000") =>
  createHmac("sha256", secret).update(`${t}.${body}`).digest("hex");

describe("verifySignature", () => {
  const body = '{"data":{"id":"evt_1"}}';
  const header = (te: string, li = "") => `t=1700000000,te=${te},li=${li}`;

  it("accepts the test signature in test mode and the live one in live mode", () => {
    expect(verifySignature(header(sig(body)), body, SECRET, false)).toBe(true);
    expect(verifySignature(header("", sig(body)), body, SECRET, true)).toBe(true);
  });

  it("rejects wrong mode, wrong secret, changed body, wrong timestamp and garbage", () => {
    expect(verifySignature(header(sig(body)), body, SECRET, true)).toBe(false);
    expect(verifySignature(header(sig(body, "other")), body, SECRET, false)).toBe(false);
    expect(verifySignature(header(sig(body)), body + " ", SECRET, false)).toBe(false);
    expect(verifySignature(header(sig(body, SECRET, "1")), body, SECRET, false)).toBe(false);
    expect(verifySignature("nonsense", body, SECRET, false)).toBe(false);
    expect(verifySignature(header("zz"), body, SECRET, false)).toBe(false);
  });
});

const envelope = (type: string, data: unknown, livemode = false) =>
  JSON.stringify({ data: { id: "evt_123", attributes: { type, livemode, data } } });
const PAYMENT_ID = "6f1c1a2e-6a55-4c49-9d43-0d3b1f6f2a11";

describe("parseEvent", () => {
  it("reads our payment id, PayMongo payment id and paid amount from a paid checkout", () => {
    const e = parseEvent(
      envelope("checkout_session.payment.paid", {
        id: "cs_1",
        attributes: {
          reference_number: PAYMENT_ID,
          metadata: { payment_id: PAYMENT_ID },
          payments: [
            { id: "pay_failed", attributes: { amount: 9900, status: "failed" } },
            { id: "pay_ok", attributes: { amount: 9900, status: "paid" } },
          ],
        },
      }),
    );
    expect(e).toEqual({
      eventId: "evt_123",
      type: "checkout_session.payment.paid",
      livemode: false,
      paymentId: PAYMENT_ID,
      providerPayment: "pay_ok",
      amount: 9900,
    });
  });

  it("won't act on a paid checkout without a valid reference or paid payment", () => {
    const e = parseEvent(
      envelope("checkout_session.payment.paid", {
        attributes: { reference_number: "not-a-uuid", payments: [] },
      }),
    );
    expect(e.type).toBe("checkout_session.unusable");
  });

  it("reads the payment id from both refund event shapes, and only final refunds count", () => {
    expect(parseEvent(envelope("payment.refunded", { id: "pay_9" })).providerPayment).toBe("pay_9");
    const wrapped = parseEvent(
      envelope("payment.refund.updated", {
        id: "ref_1",
        attributes: { payment_id: "pay_9", status: "succeeded" },
      }),
    );
    expect(wrapped).toMatchObject({ type: "payment.refund.updated", providerPayment: "pay_9" });
    const flat = parseEvent(
      envelope("payment.refund.updated", { id: "ref_1", payment_id: "pay_9", status: "pending" }),
    );
    expect(flat.type).toBe("payment.refund.not_final");
  });

  it("throws on a malformed envelope", () => {
    expect(() => parseEvent("{}")).toThrow();
    expect(() => parseEvent("not json")).toThrow();
  });
});
