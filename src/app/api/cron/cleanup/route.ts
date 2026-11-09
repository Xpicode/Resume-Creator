import { timingSafeEqual } from "node:crypto";
import {
  deleteOldAiSuggestions,
  deleteOldRateLimitHits,
  deleteStaleGuests,
} from "@/features/account/admin-ops";
import { serverEnv } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/admin";

/** Daily (vercel.json): delete guest accounts inactive for 30 days, with their photos (plan 6.2). */
export async function GET(request: Request) {
  const secret = serverEnv().CRON_SECRET;
  if (!secret) return new Response("CRON_SECRET not set", { status: 503 });

  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return new Response(null, { status: 401 });
  }

  const admin = supabaseAdmin();
  const deleted = await deleteStaleGuests(admin);
  await deleteOldAiSuggestions(admin);
  await deleteOldRateLimitHits(admin);
  return Response.json({ deleted }, { headers: { "Cache-Control": "no-store" } });
}
