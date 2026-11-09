import {
  isLiveMode,
  parseEvent,
  paymentsConfigured,
  verifySignature,
} from "@/features/billing/paymongo";
import { PASS } from "@/features/billing/plans";
import { serverEnv } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * PayMongo webhook (plan 3.2): verify signature on the raw body → dedupe by event id → grant/revoke in
 * one DB transaction. 200 for anything we don't act on (non-200 makes PayMongo retry up to 12 times);
 * 500 only when the database failed, so the retry can succeed later.
 */
export async function POST(request: Request) {
  if (!paymentsConfigured()) return new Response(null, { status: 503 });

  const raw = await request.text();
  if (raw.length > 512_000) return new Response(null, { status: 413 });
  const signature = request.headers.get("paymongo-signature");
  const live = isLiveMode();
  if (!signature || !verifySignature(signature, raw, serverEnv().PAYMONGO_WEBHOOK_SECRET!, live)) {
    return new Response(null, { status: 401 });
  }

  let event;
  try {
    event = parseEvent(raw);
  } catch {
    return new Response(null, { status: 400 });
  }
  if (event.livemode !== live) return Response.json({ received: true });

  const { error } = await supabaseAdmin().rpc("process_payment_event", {
    event_id: event.eventId,
    event_type: event.type,
    event_livemode: event.livemode,
    payment_id: event.paymentId,
    provider_payment: event.providerPayment,
    paid_amount: event.amount,
    pass_days: PASS.days,
    pass_credits: PASS.aiCredits,
  });
  if (error) {
    console.error("paymongo webhook: db error", error.code); // codes only — never payloads
    return new Response(null, { status: 500 });
  }
  return Response.json({ received: true });
}
