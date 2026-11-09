import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/** The active Job Hunt Pass, with the end of any back-to-back passes bought after it. Null on Free. */
export async function activePass(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ endsAt: string } | null> {
  const now = new Date().toISOString();
  const { data } = await supabase
    .from("entitlements")
    .select("starts_at, ends_at")
    .eq("user_id", userId)
    .eq("plan", "pass_30d")
    .gt("ends_at", now);
  const rows = data ?? [];
  if (!rows.some((r) => Date.parse(r.starts_at) <= Date.now())) return null;
  const end = Math.max(...rows.map((r) => Date.parse(r.ends_at)));
  return { endsAt: new Date(end).toISOString() };
}

export const dateFmt = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeZone: "Asia/Manila",
});
