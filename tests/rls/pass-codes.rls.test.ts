import type { User } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PASS } from "@/features/billing/plans";
import {
  adminClient,
  deleteUsers,
  hasDb,
  newAnonymousUser,
  newUser,
  type TestUser,
} from "./helpers";

// Pass codes: the owner is paid directly, an admin generates a code, the customer redeems it.
const ADMIN_EMAIL = `admin-${crypto.randomUUID()}@example.com`;
process.env.ADMIN_EMAILS = `someone-else@example.com, ${ADMIN_EMAIL.toUpperCase()}`;

const session: { user: User | null } = { user: null };
vi.mock("@/lib/auth", async (orig) => ({
  ...(await orig<typeof import("@/lib/auth")>()),
  getUser: async () => session.user,
  requireUser: async () => session.user!,
}));

const { newPassCode, normalizePassCode, hashPassCode } = await import("@/features/billing/codes");
const { generateCodes, redeemCode, revokeCode } = await import("@/features/billing/code-actions");

const form = (fields: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
};

/** Runs an action; returns its result, or "redirect:<url>" / "404" for Next's control-flow throws. */
async function outcome<T>(p: Promise<T>): Promise<T | string> {
  try {
    return await p;
  } catch (e) {
    const digest = String((e as { digest?: string }).digest ?? "");
    if (digest.startsWith("NEXT_REDIRECT")) return `redirect:${digest.split(";")[2]}`;
    if (digest.includes("404")) return "404";
    throw e;
  }
}

const as = async (u: { id: string }) => {
  session.user = (await adminClient().auth.admin.getUserById(u.id)).data.user;
};
const redeem = (code: string) => outcome(redeemCode(null, form({ code })));

async function makeCodes(admin: { id: string }, count = 1, note = "") {
  await as(admin);
  const result = await outcome(generateCodes(null, form({ count: String(count), note })));
  if (typeof result === "string" || !result) throw new Error(`generate failed: ${result}`);
  return result.codes;
}

const passes = async (uid: string) =>
  (
    await adminClient()
      .from("entitlements")
      .select("starts_at, ends_at, ai_credits_remaining, source_code_id")
      .eq("user_id", uid)
      .eq("plan", "pass_30d")
      .order("starts_at")
  ).data ?? [];

describe("pass code format", () => {
  it("is JHP-XXXX-XXXX-XXXX without look-alike characters, and unique", () => {
    const codes = new Set(Array.from({ length: 2000 }, newPassCode));
    expect(codes.size).toBe(2000);
    for (const c of codes)
      expect(c).toMatch(/^JHP-[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{4}$/);
  });

  it("forgives case, spaces, dashes and a missing prefix", () => {
    const code = "JHP-7KQM-X3PD-9RTW";
    const canonical = normalizePassCode(code);
    for (const typed of [
      "jhp-7kqm-x3pd-9rtw",
      " JHP 7KQM X3PD 9RTW ",
      "7KQM-X3PD-9RTW",
      "jhp7kqmx3pd9rtw",
    ]) {
      expect(normalizePassCode(typed)).toBe(canonical);
    }
    expect(normalizePassCode("JHP-7KQM")).toBeNull();
    expect(normalizePassCode("XYZ-7KQM-X3PD-9RTW")).toBeNull();
    expect(hashPassCode(canonical!)).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe.skipIf(!hasDb)("pass codes", () => {
  let admin: { id: string };
  let customer: TestUser;
  let other: TestUser;

  beforeAll(async () => {
    const { data } = await adminClient().auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: `pw-${crypto.randomUUID()}`,
      email_confirm: true,
    });
    admin = { id: data.user!.id }; // never signed in yet → no recent login (tested below)
    [customer, other] = await Promise.all([newUser(), newUser()]);
  });
  afterAll(async () => {
    await deleteUsers(customer, other);
    await adminClient().auth.admin.deleteUser(admin.id);
  });

  it("only admins can generate codes (everyone else gets a 404)", async () => {
    await as(customer);
    expect(await outcome(generateCodes(null, form({ count: "1", note: "" })))).toBe("404");
  });

  it("asks the admin to log in again if their login isn't recent", async () => {
    await as(admin); // created with a password but never signed in → no recent login
    const result = await outcome(generateCodes(null, form({ count: "1", note: "" })));
    expect(result).toMatchObject({ codes: [], error: expect.stringContaining("log in again") });
  });

  describe("with a recently logged-in admin", () => {
    beforeAll(async () => {
      const { data } = await adminClient().auth.admin.getUserById(admin.id);
      const password = `pw-${crypto.randomUUID()}`;
      await adminClient().auth.admin.updateUserById(admin.id, { password });
      const { browserClient } = await import("./helpers");
      await browserClient().auth.signInWithPassword({ email: data.user!.email!, password });
    });

    it("stores only hashes, never the code itself", async () => {
      const codes = await makeCodes(admin, 3, "Juan · GCash 123");
      expect(codes).toHaveLength(3);
      const { data } = await adminClient()
        .from("pass_codes")
        .select("*")
        .in(
          "code_hint",
          codes.map((c) => c.slice(-4)),
        );
      const stored = JSON.stringify(data);
      for (const c of codes) {
        expect(stored).not.toContain(c);
        expect(stored).not.toContain(normalizePassCode(c)!);
      }
      expect(data!.every((r) => r.note === "Juan · GCash 123")).toBe(true);
    });

    it("a valid code gives the Job Hunt Pass once; a second use is refused", async () => {
      const [code] = await makeCodes(admin);
      await as(customer);
      expect(await redeem(code.toLowerCase())).toBe("redirect:/billing?redeemed=1");
      const [pass] = await passes(customer.id);
      expect(pass.ai_credits_remaining).toBe(PASS.aiCredits);
      expect((Date.parse(pass.ends_at) - Date.parse(pass.starts_at)) / 86_400_000).toBe(PASS.days);
      expect((await adminClient().rpc("resume_limit", { uid: customer.id })).data).toBe(
        PASS.resumeLimit,
      );

      await as(other);
      expect(await redeem(code)).toEqual({ message: "This code was already used." });
      expect(await passes(other.id)).toEqual([]);
    });

    it("rejects made-up and malformed codes", async () => {
      await as(other);
      expect(await redeem(newPassCode())).toEqual({
        message: "This code isn't valid. Check it and try again.",
      });
      expect(await redeem("hello")).toMatchObject({
        message: expect.stringContaining("look like"),
      });
    });

    it("guests can't redeem (the pass must belong to a real account)", async () => {
      const [code] = await makeCodes(admin);
      const guest = await newAnonymousUser();
      try {
        await as(guest);
        expect(await redeem(code)).toMatchObject({ message: expect.stringContaining("account") });
      } finally {
        await deleteUsers(guest);
      }
    });

    it("revoking an unused code stops it; revoking a used one ends the pass (refund)", async () => {
      const [unused, used] = await makeCodes(admin, 2);
      const c = await newUser();
      try {
        const ids = Object.fromEntries(
          (
            await adminClient()
              .from("pass_codes")
              .select("id, code_hint")
              .in("code_hint", [unused.slice(-4), used.slice(-4)])
          ).data!.map((r) => [r.code_hint, r.id]),
        );
        await as(admin);
        expect(await outcome(revokeCode(form({ id: ids[unused.slice(-4)] })))).toBe(
          "redirect:/admin",
        );
        await as(c);
        expect(await redeem(unused)).toMatchObject({
          message: expect.stringContaining("isn't valid"),
        });

        expect(await redeem(used)).toBe("redirect:/billing?redeemed=1");
        await as(admin);
        await outcome(revokeCode(form({ id: ids[used.slice(-4)] })));
        const [pass] = await passes(c.id);
        expect(Date.parse(pass.ends_at)).toBeLessThanOrEqual(Date.now());
        expect(pass.ai_credits_remaining).toBe(0);
        expect((await adminClient().rpc("resume_limit", { uid: c.id })).data).toBe(1);
      } finally {
        await deleteUsers(c);
      }
    });

    it("a second code while a pass is active adds 30 days after it", async () => {
      const [first, second] = await makeCodes(admin, 2);
      const c = await newUser();
      try {
        await as(c);
        await redeem(first);
        await redeem(second);
        const [a, b] = await passes(c.id);
        expect(b.starts_at).toBe(a.ends_at);
      } finally {
        await deleteUsers(c);
      }
    });

    it("stops guessing after 10 tries an hour", async () => {
      const c = await newUser();
      try {
        await as(c);
        for (let i = 0; i < 10; i++) await redeem(newPassCode());
        expect(await redeem(newPassCode())).toEqual({
          message: "Too many tries. Please wait an hour and try again.",
        });
      } finally {
        await deleteUsers(c);
      }
    });

    it("users can't read codes or call the code functions themselves", async () => {
      expect((await customer.client.from("pass_codes").select("*")).data ?? []).toEqual([]);
      const forge = await customer.client.rpc("redeem_pass_code", {
        uid: customer.id,
        hash: "0".repeat(64),
        pass_days: 3650,
        pass_credits: 99999,
      });
      expect(forge.error).not.toBeNull();
      const revoke = await customer.client.rpc("revoke_pass_code", {
        code_id: crypto.randomUUID(),
      });
      expect(revoke.error).not.toBeNull();
      const insert = await customer.client
        .from("pass_codes")
        .insert({ code_hash: "a".repeat(64), code_hint: "AAAA" });
      expect(insert.error).not.toBeNull();
    });
  });
});
