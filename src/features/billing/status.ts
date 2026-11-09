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

export type PassRow = {
  id: string;
  startsAt: string;
  endsAt: string;
  via: "code" | "online";
  status: "Active" | "Starts later" | "Ended";
};

/** The user's passes, newest first, for the Billing page history. */
export async function listPasses(supabase: SupabaseClient, userId: string): Promise<PassRow[]> {
  const { data } = await supabase
    .from("entitlements")
    .select("id, starts_at, ends_at, source_code_id")
    .eq("user_id", userId)
    .eq("plan", "pass_30d")
    .order("starts_at", { ascending: false })
    .limit(20);
  const now = Date.now();
  return (data ?? []).map((p) => {
    const start = Date.parse(p.starts_at);
    const end = Date.parse(p.ends_at);
    return {
      id: p.id,
      startsAt: p.starts_at,
      endsAt: p.ends_at,
      via: p.source_code_id ? "code" : "online",
      status: end <= now ? "Ended" : start > now ? "Starts later" : "Active",
    };
  });
}

export const dateFmt = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeZone: "Asia/Manila",
});
