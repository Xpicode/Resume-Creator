import type { SupabaseClient, User } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { RATE_LIMITS } from "@/lib/security/rate-limit";
import { adminClient, deleteUsers, hasDb, newUser, type TestUser } from "./helpers";

// Plan 6.7: per-user limits on preview, PDF, photo upload and export.
const session: { user: User | null; client: SupabaseClient | null } = { user: null, client: null };
vi.mock("@/lib/auth", async (orig) => ({
  ...(await orig<typeof import("@/lib/auth")>()),
  getUser: async () => session.user,
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => session.client }));

const { takeRateLimit } = await import("@/lib/security/rate-limit");
const { GET: downloadPdf } = await import("@/app/api/resumes/[id]/pdf/route");

const hit = (uid: string, action: string, max: number, seconds = 60) =>
  adminClient().rpc("hit_rate_limit", {
    uid,
    action_name: action,
    max_hits: max,
    window_seconds: seconds,
  });

describe.skipIf(!hasDb)("rate limits", () => {
  let a: TestUser;
  let b: TestUser;
  beforeAll(async () => {
    [a, b] = await Promise.all([newUser(), newUser()]);
  });
  afterAll(() => deleteUsers(a, b));

  it("allows up to the limit, then refuses — per user and per action", async () => {
    const results = [];
    for (let i = 0; i < 4; i++) results.push((await hit(a.id, "photo", 3)).data);
    expect(results).toEqual([true, true, true, false]);
    expect((await hit(b.id, "photo", 3)).data).toBe(true); // another user isn't affected
    expect((await hit(a.id, "pdf", 3)).data).toBe(true); // another action isn't affected
  });

  it("can't be beaten with 20 parallel requests", async () => {
    const c = await newUser();
    try {
      const results = await Promise.all(Array.from({ length: 20 }, () => hit(c.id, "preview", 5)));
      expect(results.filter((r) => r.data === true)).toHaveLength(5);
    } finally {
      await deleteUsers(c);
    }
  });

  it("frees up again once the window has passed", async () => {
    const c = await newUser();
    try {
      for (let i = 0; i < 3; i++) await hit(c.id, "export", 3, 86_400);
      expect((await hit(c.id, "export", 3, 86_400)).data).toBe(false);
      await adminClient()
        .from("rate_limit_hits")
        .update({ created_at: new Date(Date.now() - 2 * 86_400_000).toISOString() })
        .eq("user_id", c.id);
      expect((await hit(c.id, "export", 3, 86_400)).data).toBe(true);
    } finally {
      await deleteUsers(c);
    }
  });

  it("users can't read, reset or call the limiter themselves", async () => {
    expect((await a.client.from("rate_limit_hits").select("*")).data ?? []).toEqual([]);
    const del = await a.client.from("rate_limit_hits").delete().eq("user_id", a.id).select();
    expect(del.data ?? []).toEqual([]);
    const { count } = await adminClient()
      .from("rate_limit_hits")
      .select("*", { count: "exact", head: true })
      .eq("user_id", a.id);
    expect(count).toBeGreaterThan(0);
    const rpc = await a.client.rpc("hit_rate_limit", {
      uid: a.id,
      action_name: "pdf",
      max_hits: 9999,
      window_seconds: 1,
    });
    expect(rpc.error).not.toBeNull();
  });

  it("the PDF download returns 429 once the hourly limit is used up", async () => {
    const c = await newUser();
    try {
      const { data: resume } = await c.client
        .from("resumes")
        .insert({
          title: "Limit test",
          content: { version: 1, personal: { firstName: "Ana" }, sections: [] },
        })
        .select("id")
        .single();
      session.user = (await adminClient().auth.admin.getUserById(c.id)).data.user;
      session.client = c.client;
      const download = () =>
        downloadPdf(new Request("http://x/api/resumes/pdf"), {
          params: Promise.resolve({ id: resume!.id }),
        });

      expect((await download()).status).toBe(200);
      const rows = Array.from({ length: RATE_LIMITS.pdf.max }, () => ({
        user_id: c.id,
        action: "pdf",
      }));
      await adminClient().from("rate_limit_hits").insert(rows);
      const blocked = await download();
      expect(blocked.status).toBe(429);
      expect(blocked.headers.get("retry-after")).toBe(String(RATE_LIMITS.pdf.seconds));
      expect(await takeRateLimit(c.id, "preview")).toBe(true); // preview has its own budget
    } finally {
      await deleteUsers(c);
    }
  });
});
