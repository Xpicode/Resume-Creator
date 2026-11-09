import "server-only";
import type { User } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * The logged-in user, verified with Supabase Auth (not just decoded from the cookie).
 * Every page, action and route checks this itself — never proxy.ts (plan 6.3).
 */
export async function getUser(): Promise<User | null> {
  // Per-user data is never prerendered. Without this, Next's runtime prefetch prerenders the page
  // with cookies and fails on the clock reads inside supabase-js ("unstable value Date.now()").
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function requireUser(): Promise<User> {
  const user = await getUser();
  if (!user) redirect("/start");
  return user;
}

/** Signed in within the last `minutes` (re-auth for export/delete, plan 6.2). Guests can't re-login, so they pass. */
export function hasRecentLogin(user: User, minutes = 10): boolean {
  if (user.is_anonymous) return true;
  const last = user.last_sign_in_at ? Date.parse(user.last_sign_in_at) : 0;
  return Date.now() - last < minutes * 60_000;
}

/** Only same-site relative paths, so `?next=` can't redirect to another website. */
export function safeNext(value: unknown, fallback = "/dashboard"): string {
  return typeof value === "string" && /^\/(?![/\\])[\w\-/?=&.%]*$/.test(value) ? value : fallback;
}

/** This site's origin from the request (redirect URLs for auth emails and checkout). */
export async function siteOrigin(): Promise<string> {
  // Auth redirect URLs are also checked against Supabase's allow-list, so a forged Host can't redirect elsewhere.
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
