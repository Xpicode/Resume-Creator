"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { mergeGuestInto } from "@/features/account/admin-ops";
import { getUser, safeNext } from "@/lib/auth";
import { serverEnv } from "@/lib/env";
import { PRIVACY_POLICY_VERSION, TERMS_VERSION } from "@/lib/legal";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { createMergeTicket, MERGE_COOKIE, MERGE_TTL_SECONDS } from "./merge-ticket";

export type FormState = { status: "idle" | "error" | "success"; message?: string };

const fail = (message: string): FormState => ({ status: "error", message });
const field = (fd: FormData, name: string) => {
  const v = fd.get(name);
  return typeof v === "string" ? v : "";
};
const captcha = (fd: FormData) => field(fd, "cf-turnstile-response") || undefined;

const email = z.string().trim().toLowerCase().pipe(z.email().max(254));
const password = z.string().min(10, "Use at least 10 characters.").max(72);
const CONSENT_MESSAGE = "Please agree to the Privacy Policy and Terms to continue.";

async function siteOrigin(): Promise<string> {
  // Redirect URLs are also checked against Supabase's allow-list, so a forged Host can't redirect elsewhere.
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

async function recordConsents(client: SupabaseClient, userId?: string) {
  const rows = [
    { consent_type: "privacy_policy", version: PRIVACY_POLICY_VERSION },
    { consent_type: "terms", version: TERMS_VERSION },
  ].map((r) => (userId ? { ...r, user_id: userId } : r));
  const { error } = await client.from("consents").insert(rows);
  if (error) throw new Error(`consent insert failed: ${error.code}`);
}

/** Lets a guest's resume follow them through a Google or email-link round trip (see merge-ticket.ts). */
async function rememberGuest(guestId: string) {
  (await cookies()).set(MERGE_COOKIE, createMergeTicket(guestId, serverEnv().MERGE_TICKET_SECRET), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MERGE_TTL_SECONDS,
  });
}

/** Start building without an account (plan 6.2). */
export async function startAsGuest(_prev: FormState, fd: FormData): Promise<FormState> {
  if (field(fd, "consent") !== "on") return fail(CONSENT_MESSAGE);
  const supabase = await createClient();

  if (!(await getUser())) {
    const { error } = await supabase.auth.signInAnonymously({
      options: { captchaToken: captcha(fd) },
    });
    if (error) return fail("We couldn't start your session. Please try again.");
  }
  await recordConsents(supabase);
  redirect("/onboarding");
}

export async function signUpWithEmail(_prev: FormState, fd: FormData): Promise<FormState> {
  if (field(fd, "consent") !== "on") return fail(CONSENT_MESSAGE);
  const parsed = z
    .object({ email, password })
    .safeParse({ email: field(fd, "email"), password: field(fd, "password") });
  if (!parsed.success)
    return fail(parsed.error.issues[0]?.message ?? "Check your email and password.");

  const current = await getUser();
  if (current?.is_anonymous) await rememberGuest(current.id);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: { captchaToken: captcha(fd), emailRedirectTo: `${await siteOrigin()}/auth/callback` },
  });
  if (error) {
    if (error.code === "weak_password")
      return fail("That password is too common or has appeared in a data leak. Try another.");
    return fail("We couldn't create your account. Please try again.");
  }
  // Supabase returns a fake user (no identities) when the email is taken — no consents, and the same
  // message either way so nobody can test which emails have accounts.
  if (data.user?.identities?.length) await recordConsents(supabaseAdmin(), data.user.id);
  return {
    status: "success",
    message:
      "Check your email for a link to confirm your account. Already have one? Log in instead — your resume comes with you.",
  };
}

export async function logIn(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = z
    .object({ email, password: z.string().min(1).max(72) })
    .safeParse({ email: field(fd, "email"), password: field(fd, "password") });
  if (!parsed.success) return fail("Enter your email and password.");

  const guest = await getUser(); // verified current session, before we switch accounts
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    ...parsed.data,
    options: { captchaToken: captcha(fd) },
  });
  if (error) {
    return fail(
      error.code === "email_not_confirmed"
        ? "Please confirm your email first — check your inbox."
        : "Wrong email or password.",
    );
  }
  if (guest?.is_anonymous) await mergeGuestInto(supabaseAdmin(), guest.id, data.user.id);
  redirect(safeNext(field(fd, "next")));
}

export async function continueWithGoogle(fd: FormData): Promise<void> {
  const next = safeNext(field(fd, "next"));
  const current = await getUser();
  if (current?.is_anonymous) await rememberGuest(current.id);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${await siteOrigin()}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error || !data.url) redirect("/login?error=google");
  redirect(data.url);
}

export async function requestPasswordReset(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = email.safeParse(field(fd, "email"));
  if (!parsed.success) return fail("Enter a valid email address.");
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${await siteOrigin()}/auth/callback?next=/auth/set-password`,
    captchaToken: captcha(fd),
  });
  // Same answer whether or not the account exists.
  return {
    status: "success",
    message: "If an account uses that email, we've sent a link to reset your password.",
  };
}

export async function setPassword(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await getUser();
  if (!user || user.is_anonymous) redirect("/login");
  const parsed = password.safeParse(field(fd, "password"));
  if (!parsed.success)
    return fail(parsed.error.issues[0]?.message ?? "Choose a stronger password.");
  if (parsed.data !== field(fd, "confirm")) return fail("The two passwords don't match.");

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data });
  if (error) {
    if (error.code === "weak_password")
      return fail("That password is too common or has appeared in a data leak. Try another.");
    if (error.code === "reauthentication_needed")
      return fail("For your security, log in again, then change your password.");
    return fail("We couldn't update your password. Please try again.");
  }
  redirect("/dashboard");
}

/** Shown after Google sign-up, which skips our consent checkbox. */
export async function acceptTerms(_prev: FormState, fd: FormData): Promise<FormState> {
  if (field(fd, "consent") !== "on") return fail(CONSENT_MESSAGE);
  const user = await getUser();
  if (!user) redirect("/login");
  await recordConsents(await createClient());
  redirect(safeNext(field(fd, "next")));
}

export async function logOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
