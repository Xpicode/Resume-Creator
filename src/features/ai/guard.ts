import "server-only";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  AI_CALLS_PER_MINUTE,
  AI_FEATURES,
  FREE_MONTHLY_AI_CREDITS,
  type AiFeature,
} from "./config";
import { aiConfigured, type AiCall } from "./provider";

export type AiBlock = "auth" | "guest" | "unverified" | "consent" | "unavailable";
export type AiFailure = {
  ok: false;
  code: AiBlock | "rate" | "credits" | "failed" | "refused";
  message: string;
};

const MESSAGES: Record<AiFailure["code"], string> = {
  auth: "Please log in again.",
  guest: "Create a free account to use AI features.",
  unverified: "Confirm your email address to use AI features.",
  consent: "Turn on AI features first.",
  unavailable: "AI features aren't available right now.",
  rate: "That's a lot of AI requests at once. Wait a minute and try again.",
  credits: "You've used this month's AI credits.",
  failed: "The AI couldn't finish that. Try again — you weren't charged a credit.",
  refused: "The AI couldn't help with that text. Try rewording it — you weren't charged a credit.",
};

export const fail = (code: AiFailure["code"]): AiFailure => ({
  ok: false,
  code,
  message: MESSAGES[code],
});

export async function hasAiConsent(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const { count } = await supabase
    .from("consents")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("consent_type", "ai_processing")
    .is("withdrawn_at", null);
  return Boolean(count);
}

/** Why AI is unavailable for this user, or null if it's available. Also used to render the UI. */
export async function aiBlock(
  user: User | null,
  supabase: SupabaseClient,
): Promise<AiBlock | null> {
  if (!user) return "auth";
  if (user.is_anonymous) return "guest";
  if (!user.email_confirmed_at) return "unverified";
  if (!aiConfigured()) return "unavailable";
  if (!(await hasAiConsent(supabase, user.id))) return "consent";
  return null;
}

/** Credits left this month (the Free row is created on first use, so none yet = full allowance). */
export async function creditsLeft(supabase: SupabaseClient, userId: string): Promise<number> {
  const { data } = await supabase
    .from("entitlements")
    .select("ai_credits_remaining, ends_at, starts_at")
    .eq("user_id", userId);
  const now = Date.now();
  const active = (data ?? []).filter(
    (e) => Date.parse(e.starts_at) <= now && (!e.ends_at || Date.parse(e.ends_at) > now),
  );
  if (!active.length) return FREE_MONTHLY_AI_CREDITS;
  return active.reduce((sum, e) => sum + e.ai_credits_remaining, 0);
}

/**
 * Every AI call goes through here (plan 3.2): auth → verified account → consent → per-minute cap →
 * atomic credit charge → call → usage log (tokens only) → refund on failure.
 */
export async function withAi<T>(
  feature: AiFeature,
  task: (ctx: { user: User; supabase: SupabaseClient }) => Promise<AiCall<T> | AiFailure>,
): Promise<{ ok: true; data: T; creditsLeft: number } | AiFailure> {
  const user = await getUser();
  const supabase = await createClient();
  const blocked = await aiBlock(user, supabase);
  if (blocked || !user) return fail(blocked ?? "auth");

  const since = new Date(Date.now() - 60_000).toISOString();
  const { count } = await supabase
    .from("ai_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", since);
  if ((count ?? 0) >= AI_CALLS_PER_MINUTE) return fail("rate");

  const admin = supabaseAdmin();
  const cost = AI_FEATURES[feature].credits;
  const { data: entitlement } = await admin.rpc("consume_ai_credits", {
    uid: user.id,
    amount: cost,
  });
  if (!entitlement) return fail("credits");

  let result: AiCall<T> | AiFailure;
  try {
    result = await task({ user, supabase });
  } catch {
    result = fail("failed");
  }

  if ("usage" in result) {
    await admin.from("ai_usage").insert({
      user_id: user.id,
      feature,
      model: result.usage.model,
      input_tokens: result.usage.input,
      output_tokens: result.usage.output,
      status: result.ok ? "ok" : result.reason,
    });
  }

  if (!result.ok) {
    await admin.rpc("refund_ai_credits", { entitlement, amount: cost });
    if ("code" in result) return result;
    return fail(result.reason === "refused" ? "refused" : "failed");
  }
  return { ok: true, data: result.data, creditsLeft: await creditsLeft(supabase, user.id) };
}
