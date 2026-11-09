import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { FREE_MONTHLY_AI_CREDITS } from "@/features/ai/config";
import {
  adminClient,
  deleteUsers,
  hasDb,
  newAnonymousUser,
  newUser,
  type TestUser,
} from "./helpers";

// Plan Phase 2 done-when: "Credits can't go below zero even with 20 parallel requests".
describe.skipIf(!hasDb)("AI credits and tables", () => {
  let a: TestUser;
  let b: TestUser;
  let aResume: string;

  beforeAll(async () => {
    [a, b] = await Promise.all([newUser(), newUser()]);
    const { data } = await a.client.from("resumes").insert({ title: "A" }).select("id").single();
    aResume = data!.id;
  });
  afterAll(() => deleteUsers(a, b));

  const consume = (uid: string, amount = 1) =>
    adminClient().rpc("consume_ai_credits", { uid, amount });

  it("gives the monthly Free allowance on first use", async () => {
    const { data, error } = await consume(a.id);
    expect(error).toBeNull();
    expect(data).toBeTruthy();
    const { data: row } = await a.client
      .from("entitlements")
      .select("plan, ai_credits_remaining")
      .single();
    expect(row).toEqual({ plan: "free", ai_credits_remaining: FREE_MONTHLY_AI_CREDITS - 1 });
  });

  it("never goes below zero with 20 parallel requests", async () => {
    const c = await newUser();
    try {
      const results = await Promise.all(Array.from({ length: 20 }, () => consume(c.id)));
      const granted = results.filter((r) => r.data).length;
      expect(results.every((r) => r.error === null)).toBe(true);
      expect(granted).toBe(FREE_MONTHLY_AI_CREDITS);
      const { data } = await adminClient()
        .from("entitlements")
        .select("ai_credits_remaining")
        .eq("user_id", c.id)
        .single();
      expect(data!.ai_credits_remaining).toBe(0);
    } finally {
      await deleteUsers(c);
    }
  });

  it("refuses a multi-credit request it can't fully pay, and refunds work", async () => {
    const c = await newUser();
    try {
      for (let i = 0; i < FREE_MONTHLY_AI_CREDITS - 1; i++) await consume(c.id);
      expect((await consume(c.id, 3)).data).toBeNull(); // 1 left, 3 asked
      const one = await consume(c.id, 1);
      expect(one.data).toBeTruthy();
      await adminClient().rpc("refund_ai_credits", { entitlement: one.data, amount: 1 });
      expect((await consume(c.id, 1)).data).toBeTruthy();
    } finally {
      await deleteUsers(c);
    }
  });

  it("gives guests and unconfirmed emails no AI credits", async () => {
    const guest = await newAnonymousUser();
    const { data: created } = await adminClient().auth.admin.createUser({
      email: `unconfirmed-${crypto.randomUUID()}@example.com`,
      password: `pw-${crypto.randomUUID()}`,
    });
    try {
      expect((await consume(guest.id)).data).toBeNull();
      expect((await consume(created.user!.id)).data).toBeNull();
    } finally {
      await deleteUsers(guest);
      await adminClient().auth.admin.deleteUser(created.user!.id);
    }
  });

  it("users cannot call the credit functions or write entitlements / usage", async () => {
    expect(
      (await a.client.rpc("consume_ai_credits", { uid: a.id, amount: 1 })).error,
    ).not.toBeNull();
    expect(
      (await a.client.rpc("refund_ai_credits", { entitlement: a.id, amount: 99 })).error,
    ).not.toBeNull();
    const upd = await a.client
      .from("entitlements")
      .update({ ai_credits_remaining: 999 })
      .eq("user_id", a.id)
      .select("id");
    expect(upd.data ?? []).toEqual([]);
    const ins = await a.client.from("entitlements").insert({
      user_id: a.id,
      plan: "pass_30d",
      ai_credits_remaining: 999,
      starts_at: new Date().toISOString(),
    });
    expect(ins.error).not.toBeNull();
    const usage = await a.client
      .from("ai_usage")
      .insert({ user_id: a.id, feature: "tailor", model: "x", status: "ok" });
    expect(usage.error).not.toBeNull();
  });

  it("job posts and suggestions stay private and can't point at someone else's resume", async () => {
    const own = await a.client
      .from("job_targets")
      .insert({ resume_id: aResume, job_description: "We need an IT support specialist." })
      .select("id")
      .single();
    expect(own.error).toBeNull();

    expect((await b.client.from("job_targets").select("id").eq("id", own.data!.id)).data).toEqual(
      [],
    );
    const intoA = await b.client
      .from("job_targets")
      .insert({ resume_id: aResume, job_description: "x" });
    expect(intoA.error).not.toBeNull();
    const suggestionIntoA = await b.client
      .from("ai_suggestions")
      .insert({ resume_id: aResume, feature: "tailor", payload: {} });
    expect(suggestionIntoA.error).not.toBeNull();
  });

  it("consents can be withdrawn but not rewritten", async () => {
    const { data } = await a.client
      .from("consents")
      .insert({ consent_type: "ai_processing", version: "v1" })
      .select("id")
      .single();
    const rewrite = await a.client
      .from("consents")
      .update({ version: "forged", withdrawn_at: new Date().toISOString() })
      .eq("id", data!.id);
    expect(rewrite.error).not.toBeNull();
    const withdraw = await a.client
      .from("consents")
      .update({ withdrawn_at: new Date().toISOString() })
      .eq("id", data!.id)
      .select("withdrawn_at");
    expect(withdraw.data?.[0]?.withdrawn_at).toBeTruthy();
    const other = await b.client
      .from("consents")
      .update({ withdrawn_at: new Date().toISOString() })
      .eq("user_id", a.id)
      .select("id");
    expect(other.data ?? []).toEqual([]);
  });
});
