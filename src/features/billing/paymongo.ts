import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { serverEnv } from "@/lib/env";
import { PASS } from "./plans";

// PayMongo Checkout Sessions + webhooks (plan 3.2 / Phase 3A). Docs: https://docs.paymongo.com

const API = "https://api.paymongo.com/v1";
export const CHECKOUT_ORIGIN = "https://checkout.paymongo.com";

export function paymentsConfigured(): boolean {
  const env = serverEnv();
  return Boolean(env.PAYMONGO_SECRET_KEY && env.PAYMONGO_WEBHOOK_SECRET);
}

/** Live key → only live events are accepted; test key → only test events. */
export function isLiveMode(): boolean {
  return serverEnv().PAYMONGO_SECRET_KEY?.startsWith("sk_live_") ?? false;
}

const checkoutResponse = z.object({
  data: z.object({
    id: z.string().startsWith("cs_").max(100),
    attributes: z.object({ checkout_url: z.url() }),
  }),
});

/** Creates a hosted checkout for the Job Hunt Pass. The amount comes from plans.ts, never the browser. */
export async function createCheckout(paymentId: string, origin: string) {
  const key = serverEnv().PAYMONGO_SECRET_KEY!;
  const res = await fetch(`${API}/checkout_sessions`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${key}:`).toString("base64")}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      data: {
        attributes: {
          line_items: [
            {
              name: `${PASS.name} (${PASS.days} days)`,
              amount: PASS.amountCentavos,
              currency: "PHP",
              quantity: 1,
            },
          ],
          payment_method_types: ["gcash", "paymaya", "card"],
          description: `${PASS.name}: ${PASS.days} days, one-time payment, no auto-renew`,
          reference_number: paymentId,
          metadata: { payment_id: paymentId },
          send_email_receipt: true,
          success_url: `${origin}/billing?checkout=done`,
          cancel_url: `${origin}/billing?checkout=cancelled`,
        },
      },
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`paymongo_checkout_${res.status}`);
  const { data } = checkoutResponse.parse(await res.json());
  const url = data.attributes.checkout_url;
  if (!url.startsWith(`${CHECKOUT_ORIGIN}/`)) throw new Error("paymongo_checkout_url");
  return { id: data.id, url };
}

/**
 * `Paymongo-Signature: t=<timestamp>,te=<test sig>,li=<live sig>`; sig = HMAC-SHA256(secret, `${t}.${rawBody}`) as hex.
 * No timestamp window: replays are harmless because every event id is processed once (webhook_events).
 */
export function verifySignature(header: string, rawBody: string, secret: string, live: boolean) {
  const parts = Object.fromEntries(
    header.split(",").map((p) => {
      const i = p.indexOf("=");
      return [p.slice(0, i).trim(), p.slice(i + 1).trim()];
    }),
  );
  const given = live ? parts.li : parts.te;
  if (!parts.t || !given || !/^[0-9a-f]{64}$/i.test(given)) return false;
  const expected = createHmac("sha256", secret).update(`${parts.t}.${rawBody}`).digest("hex");
  return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(given.toLowerCase(), "hex"));
}

const envelope = z.object({
  data: z.object({
    id: z.string().min(1).max(100),
    attributes: z.object({
      type: z.string().max(100),
      livemode: z.boolean(),
      data: z.unknown(),
    }),
  }),
});

const checkoutPaid = z.object({
  attributes: z.object({
    reference_number: z.string().nullish(),
    metadata: z.object({ payment_id: z.string().optional() }).loose().nullish(),
    payments: z.array(
      z.object({
        id: z.string().max(100),
        attributes: z.object({ amount: z.number().int(), status: z.string() }),
      }),
    ),
  }),
});

const resourceId = z.object({ id: z.string().max(100) });
const refund = z.object({
  id: z.string().max(100).optional(),
  payment_id: z.string().max(100).optional(),
  status: z.string().optional(),
  attributes: z.object({ payment_id: z.string().max(100), status: z.string() }).optional(),
});

export type PaymentEvent = {
  eventId: string;
  type: string;
  livemode: boolean;
  paymentId: string | null;
  providerPayment: string | null;
  amount: number | null;
};

/** Pulls out only what process_payment_event needs. Throws on a malformed envelope. */
export function parseEvent(rawBody: string): PaymentEvent {
  const { data } = envelope.parse(JSON.parse(rawBody));
  const { type, livemode, data: resource } = data.attributes;
  const event: PaymentEvent = {
    eventId: data.id,
    type,
    livemode,
    paymentId: null,
    providerPayment: null,
    amount: null,
  };

  if (type === "checkout_session.payment.paid") {
    const cs = checkoutPaid.parse(resource).attributes;
    const paid = cs.payments.find((p) => p.attributes.status === "paid");
    const ref = cs.metadata?.payment_id ?? cs.reference_number ?? "";
    event.paymentId = z.uuid().safeParse(ref).success ? ref : null;
    event.providerPayment = paid?.id ?? null;
    event.amount = paid?.attributes.amount ?? null;
    if (!event.paymentId || !paid) event.type = "checkout_session.unusable";
  } else if (type === "payment.refunded") {
    event.providerPayment = resourceId.parse(resource).id;
  } else if (type === "payment.refund.updated") {
    const r = refund.parse(resource);
    const status = r.attributes?.status ?? r.status;
    event.providerPayment = r.attributes?.payment_id ?? r.payment_id ?? null;
    if (status !== "succeeded" || !event.providerPayment) event.type = "payment.refund.not_final";
  }
  return event;
}
