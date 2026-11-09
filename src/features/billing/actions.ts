"use server";

import { redirect } from "next/navigation";
import { requireUser, siteOrigin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createCheckout, paymentsConfigured } from "./paymongo";
import { PASS } from "./plans";

const MAX_OPEN_CHECKOUTS_PER_HOUR = 5;

/** "Get the Job Hunt Pass" → PayMongo hosted checkout. Access is granted only by the webhook. */
export async function startCheckout() {
  const user = await requireUser();
  if (user.is_anonymous || !user.email_confirmed_at) redirect("/billing?error=account");
  if (!paymentsConfigured()) redirect("/billing?error=unavailable");

  const admin = supabaseAdmin();
  const since = new Date(Date.now() - 60 * 60_000).toISOString();
  const { count } = await admin
    .from("payments")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", since);
  if ((count ?? 0) >= MAX_OPEN_CHECKOUTS_PER_HOUR) redirect("/billing?error=rate");

  const { data: payment, error } = await admin
    .from("payments")
    .insert({ user_id: user.id, plan: PASS.plan, amount_centavos: PASS.amountCentavos })
    .select("id")
    .single();
  if (error || !payment) redirect("/billing?error=checkout");

  let checkoutUrl: string;
  try {
    const checkout = await createCheckout(payment.id, await siteOrigin());
    await admin.from("payments").update({ checkout_id: checkout.id }).eq("id", payment.id);
    checkoutUrl = checkout.url;
  } catch (e) {
    console.error("checkout failed", e instanceof Error ? e.message : "unknown");
    await admin.from("payments").update({ status: "failed" }).eq("id", payment.id);
    redirect("/billing?error=checkout");
  }
  redirect(checkoutUrl);
}
