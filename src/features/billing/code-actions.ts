"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { getUser, hasRecentLogin } from "@/lib/auth";
import { takeRateLimit } from "@/lib/security/rate-limit";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { codeHint, hashPassCode, newPassCode, normalizePassCode } from "./codes";
import { PASS } from "./plans";

export type RedeemState = { message: string } | null;

/** Customer: type a code on the Billing page → Job Hunt Pass. */
export async function redeemCode(_prev: RedeemState, fd: FormData): Promise<RedeemState> {
  const user = await getUser();
  if (!user) return { message: "Please log in again." };
  if (user.is_anonymous || !user.email_confirmed_at) {
    return { message: "Create an account and confirm your email first." };
  }
  if (!(await takeRateLimit(user.id, "redeem"))) {
    return { message: "Too many tries. Please wait an hour and try again." };
  }
  const code = normalizePassCode(String(fd.get("code") ?? ""));
  if (!code) return { message: "That doesn't look like a code. It looks like JHP-XXXX-XXXX-XXXX." };

  const { data, error } = await supabaseAdmin().rpc("redeem_pass_code", {
    uid: user.id,
    hash: hashPassCode(code),
    pass_days: PASS.days,
    pass_credits: PASS.aiCredits,
  });
  if (error) return { message: "Something went wrong. Please try again." };
  if (data === "used") return { message: "This code was already used." };
  if (data !== "granted") return { message: "This code isn't valid. Check it and try again." };
  redirect("/billing?redeemed=1");
}

export type GenerateState = { codes: string[]; error?: string } | null;

const generateInput = z.object({
  count: z.coerce.number().int().min(1).max(50),
  note: z.string().trim().max(200),
});

/** Admin: create codes. They're shown once (only hashes are stored), never put in a URL. */
export async function generateCodes(_prev: GenerateState, fd: FormData): Promise<GenerateState> {
  const admin = await requireAdmin();
  if (!hasRecentLogin(admin, 60)) {
    return { codes: [], error: "For safety, log out and log in again, then generate codes." };
  }
  const parsed = generateInput.safeParse({ count: fd.get("count"), note: fd.get("note") ?? "" });
  if (!parsed.success) return { codes: [], error: "Choose between 1 and 50 codes." };

  const codes = Array.from({ length: parsed.data.count }, newPassCode);
  const { error } = await supabaseAdmin()
    .from("pass_codes")
    .insert(
      codes.map((c) => ({
        code_hash: hashPassCode(normalizePassCode(c)!),
        code_hint: codeHint(c),
        note: parsed.data.note,
        created_by: admin.id,
      })),
    );
  if (error) return { codes: [], error: "Couldn't save the codes. Please try again." };
  return { codes };
}

/** Admin: revoke a code. If it was already used, the customer's pass ends too (refund). */
export async function revokeCode(fd: FormData): Promise<void> {
  await requireAdmin();
  const id = z.uuid().safeParse(fd.get("id"));
  if (id.success) await supabaseAdmin().rpc("revoke_pass_code", { code_id: id.data });
  redirect("/admin");
}
