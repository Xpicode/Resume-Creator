import { connection } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/** Uptime monitor target (plan Phase 3B): 200 when the app and database answer, 503 otherwise. */
export async function GET() {
  await connection();
  const { error } = await supabaseAdmin().from("templates").select("slug").limit(1);
  return Response.json(
    { ok: !error },
    { status: error ? 503 : 200, headers: { "Cache-Control": "no-store" } },
  );
}
