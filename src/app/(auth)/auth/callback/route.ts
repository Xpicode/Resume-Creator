import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { mergeGuestInto } from "@/features/account/admin-ops";
import { MERGE_COOKIE, readMergeTicket } from "@/features/auth/merge-ticket";
import { safeNext } from "@/lib/auth";
import { serverEnv } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/** Landing point for Google sign-in, email confirmation and password-reset links. */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const next = safeNext(searchParams.get("next"));
  const to = (path: string) => NextResponse.redirect(new URL(path, request.url));

  const supabase = await createClient();
  const code = searchParams.get("code");
  if (!code) return to("/login?error=link");
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return to("/login?error=link");

  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return to("/login?error=link");

  // A guest who just signed in or confirmed a new account: bring their resume along.
  const cookieStore = await cookies();
  const guestId = readMergeTicket(
    cookieStore.get(MERGE_COOKIE)?.value,
    serverEnv().MERGE_TICKET_SECRET,
  );
  if (cookieStore.has(MERGE_COOKIE)) cookieStore.delete(MERGE_COOKIE);
  if (guestId && !user.is_anonymous) await mergeGuestInto(supabaseAdmin(), guestId, user.id);

  // Google sign-ups skip our consent checkbox; ask once before continuing.
  const { count } = await supabase
    .from("consents")
    .select("id", { count: "exact", head: true })
    .eq("consent_type", "privacy_policy");
  if (!count) return to(`/auth/consent?next=${encodeURIComponent(next)}`);

  return to(next);
}
