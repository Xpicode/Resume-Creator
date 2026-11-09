import "server-only";
import { createClient } from "@supabase/supabase-js";
import { serverEnv } from "@/lib/env";

/** Bypasses RLS. Server-only; use for webhooks, admin jobs and tables the browser must never touch. */
export function supabaseAdmin() {
  const env = serverEnv();
  return createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
