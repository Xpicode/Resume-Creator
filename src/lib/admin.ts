import "server-only";
import type { User } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { serverEnv } from "@/lib/env";

/** Admins are the confirmed, non-guest accounts whose email is listed in ADMIN_EMAILS. */
export function isAdmin(user: User | null): boolean {
  if (!user || user.is_anonymous || !user.email_confirmed_at || !user.email) return false;
  const admins = (serverEnv().ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(user.email.toLowerCase());
}

/** For admin pages and actions: everyone else gets a plain 404, so the admin area isn't advertised. */
export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (!isAdmin(user)) notFound();
  return user;
}
