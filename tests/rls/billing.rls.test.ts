import { createHmac, randomUUID } from "node:crypto";
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

// Plan Phase 3A task 6: success, failure, duplicate webhook, delayed webhook, refund —
// through the real webhook route and database, with PayMongo's signature computed like PayMongo does.
const SECRET = "whsk_test_secret_for_tests";
process.env.PAYMONGO_SECRET_KEY = "sk_test_fake_key_for_tests";
process.env.PAYMONGO_WEBHOOK_SECRET = SECRET;

const session: { user: User | null } = { user: null };
vi.mock("@/lib/auth", async (orig) => ({
  ...(await orig<typeof import("@/lib/auth")>()),
  requireUser: async () => session.user!,
  siteOrigin: async () => "https://app.example",
}));

const { POST } = await import("@/app/api/webhooks/paymongo/route");
const { startCheckout } = await import("@/features/billing/actions");

function webhook(type: string, data: unknown, opts: { livemode?: boolean; secret?: string } = {}) {
  const body = JSON.stringify({
    data: {
      id: `evt_${randomUUID()}`,
      attributes: { type, livemode: opts.livemode ?? false, data },
    },
  });
  const t = String(Math.floor(Date.now() / 1000));
  const te = createHmac("sha256", opts.secret ?? SECRET)
    .update(`${t}.${body}`)
    .digest("hex");
  return {
    body,
    send: (b = body) =>
      POST(
        new Request("https://app.example/api/webhooks/paymongo", {
          method: "POST",
          headers: { "paymongo-signature": `t=${t},te=${te},li=` },
          body: b,
        }),
      ),
  };
}

const paid = (
  paymentId: string,
  amount: number = PASS.amountCentavos,
  payRef = `pay_${randomUUID()}`,
) =>
  webhook("checkout_session.payment.paid", {
    id: `cs_${randomUUID()}`,
    attributes: {
      reference_number: paymentId,
      metadata: { payment_id: paymentId },
      payments: [{ id: payRef, attributes: { amount, status: "paid" } }],
    },
  });

async function newPayment(userId: string) {
  const { data, error } = await adminClient()
    .from("payments")
    .insert({ user_id: userId, plan: PASS.plan, amount_centavos: PASS.amountCentavos })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

const passes = async (userId: string) =>
  (
    await adminClient()
      .from("entitlements")
      .select("starts_at, ends_at, ai_credits_remaining")
      .eq("user_id", userId)
      .eq("plan", "pass_30d")
      .order("starts_at")
  ).data ?? [];

const paymentRow = async (id: string) =>
  (await adminClient().from("payments").select("*").eq("id", id).single()).data;

// Only PayMongo is faked; Supabase calls still go to the real local database.
const realFetch = globalThis.fetch;
function fakePayMongo(response: () => Response) {
  const calls: RequestInit[] = [];
  vi.stubGlobal("fetch", (url: string | URL | Request, init?: RequestInit) => {
    if (String(url).startsWith("https://api.paymongo.com/")) {
      calls.push(init!);
      return Promise.resolve(response());
    }
    return realFetch(url, init);
  });
  return calls;
}

async function redirectOf(p: Promise<unknown>): Promise<string> {
  try {
    await p;
  } catch (e) {
    const digest = (e as { digest?: string }).digest ?? "";
    if (digest.startsWith("NEXT_REDIRECT")) return digest.split(";")[2];
    throw e;
  }
  throw new Error("expected a redirect");
}

describe.skipIf(!hasDb)("payments", () => {
  let a: TestUser;
  let b: TestUser;
  beforeAll(async () => {
    [a, b] = await Promise.all([newUser(), newUser()]);
  });
  afterAll(() => deleteUsers(a, b));

  it("grants the pass only when the signed webhook arrives (delayed webhook = still Free)", async () => {
    const id = await newPayment(a.id);
    expect(await passes(a.id)).toEqual([]); // user is back on the success page; webhook not here yet
    const res = await paid(id).send();
    expect(res.status).toBe(200);
    const [pass] = await passes(a.id);
    expect(pass.ai_credits_remaining).toBe(PASS.aiCredits);
    const days = (Date.parse(pass.ends_at) - Date.parse(pass.starts_at)) / 86_400_000;
    expect(days).toBe(PASS.days);
    expect((await paymentRow(id))!.status).toBe("paid");
  });

  it("processes a duplicate webhook only once", async () => {
    const c = await newUser();
    try {
      const event = paid(await newPayment(c.id));
      expect((await event.send()).status).toBe(200);
      expect((await event.send()).status).toBe(200); // PayMongo retry of the same event
      expect(await passes(c.id)).toHaveLength(1);
    } finally {
      await deleteUsers(c);
    }
  });

  it("never grants twice for one payment, even with a different event id", async () => {
    const c = await newUser();
    try {
      const id = await newPayment(c.id);
      await paid(id).send();
      await paid(id).send();
      expect(await passes(c.id)).toHaveLength(1);
    } finally {
      await deleteUsers(c);
    }
  });

  it("rejects bad signatures, the wrong mode, and amounts that don't match the server price", async () => {
    const c = await newUser();
    try {
      const id = await newPayment(c.id);
      const forged = paid(id);
      expect((await forged.send(forged.body.replace("9900", "9901"))).status).toBe(401);
      const wrongSecret = webhook("checkout_session.payment.paid", {}, { secret: "nope" });
      expect((await wrongSecret.send()).status).toBe(401);

      expect((await paid(id, 100).send()).status).toBe(200); // paid ₱1 instead of ₱99
      expect(await passes(c.id)).toEqual([]);
      expect((await paymentRow(id))!.status).toBe("pending");

      const live = webhook(
        "checkout_session.payment.paid",
        {
          attributes: {
            reference_number: id,
            payments: [{ id: "pay_x", attributes: { amount: 9900, status: "paid" } }],
          },
        },
        { livemode: true },
      );
      expect((await live.send()).status).toBe(200); // test key configured → live events ignored
      expect(await passes(c.id)).toEqual([]);
    } finally {
      await deleteUsers(c);
    }
  });

  it("ignores failed payments and unknown events with 200 so PayMongo doesn't retry forever", async () => {
    const c = await newUser();
    try {
      const id = await newPayment(c.id);
      const failed = webhook("payment.failed", { id: "pay_f", attributes: { status: "failed" } });
      expect((await failed.send()).status).toBe(200);
      expect((await webhook("source.chargeable", {}).send()).status).toBe(200);
      expect(await passes(c.id)).toEqual([]);
      expect((await paymentRow(id))!.status).toBe("pending");
    } finally {
      await deleteUsers(c);
    }
  });

  it("a refund removes access and AI credits", async () => {
    const c = await newUser();
    try {
      const payRef = `pay_${randomUUID()}`;
      const id = await newPayment(c.id);
      await paid(id, PASS.amountCentavos, payRef).send();
      const { data: before } = await adminClient().rpc("resume_limit", { uid: c.id });
      expect(before).toBe(PASS.resumeLimit);

      expect((await webhook("payment.refunded", { id: payRef }).send()).status).toBe(200);
      const [pass] = await passes(c.id);
      expect(Date.parse(pass.ends_at)).toBeLessThanOrEqual(Date.now());
      expect(pass.ai_credits_remaining).toBe(0);
      expect((await paymentRow(id))!.status).toBe("refunded");
      const { data: after } = await adminClient().rpc("resume_limit", { uid: c.id });
      expect(after).toBe(1);
    } finally {
      await deleteUsers(c);
    }
  });

  it("buying again while a pass is active adds 30 days after the current one", async () => {
    const c = await newUser();
    try {
      await paid(await newPayment(c.id)).send();
      await paid(await newPayment(c.id)).send();
      const [first, second] = await passes(c.id);
      expect(second.starts_at).toBe(first.ends_at);
    } finally {
      await deleteUsers(c);
    }
  });

  it("a pass lifts the resume limit; Free stays at 1", async () => {
    const c = await newUser();
    try {
      await c.client.from("resumes").insert({ title: "One" });
      expect((await c.client.from("resumes").insert({ title: "Two" })).error).not.toBeNull();
      await paid(await newPayment(c.id)).send();
      expect((await c.client.from("resumes").insert({ title: "Two" })).error).toBeNull();
    } finally {
      await deleteUsers(c);
    }
  });

  it("users see only their own payments and can't write payments, events or call the function", async () => {
    const { data: own } = await a.client.from("payments").select("id");
    expect(own!.length).toBeGreaterThan(0);
    expect((await b.client.from("payments").select("id").eq("user_id", a.id)).data).toEqual([]);
    const insert = await b.client
      .from("payments")
      .insert({ user_id: b.id, plan: "pass_30d", amount_centavos: 1, status: "paid" });
    expect(insert.error).not.toBeNull();
    const upd = await a.client
      .from("payments")
      .update({ status: "paid" })
      .eq("user_id", a.id)
      .select();
    expect(upd.data ?? []).toEqual([]);
    expect((await a.client.from("webhook_events").select("*")).data ?? []).toEqual([]);
    const rpc = await a.client.rpc("process_payment_event", {
      event_id: "evt_forged",
      event_type: "checkout_session.payment.paid",
      event_livemode: false,
      payment_id: randomUUID(),
      provider_payment: "pay_forged",
      paid_amount: 9900,
      pass_days: 3650,
      pass_credits: 99999,
    });
    expect(rpc.error).not.toBeNull();
  });

  it("deleting an account keeps the sales record but unlinks it", async () => {
    const c = await newUser();
    const id = await newPayment(c.id);
    await paid(id).send();
    await deleteUsers(c);
    const row = await paymentRow(id);
    expect(row).toMatchObject({ user_id: null, status: "paid" });
    expect(await passes(c.id)).toEqual([]);
  });
});

describe.skipIf(!hasDb)("startCheckout", () => {
  let a: TestUser;
  beforeAll(async () => {
    a = await newUser();
  });
  afterAll(() => deleteUsers(a));

  it("charges the server price and sends the user to PayMongo's hosted checkout", async () => {
    session.user = (await adminClient().auth.admin.getUserById(a.id)).data.user;
    const cs = `cs_test_${randomUUID()}`;
    const calls = fakePayMongo(() =>
      Response.json({
        data: {
          id: cs,
          attributes: { checkout_url: "https://checkout.paymongo.com/cs_1" },
        },
      }),
    );
    try {
      const to = await redirectOf(startCheckout());
      expect(to).toBe("https://checkout.paymongo.com/cs_1");
      const sent = JSON.parse(calls[0].body as string);
      expect(sent.data.attributes.line_items[0].amount).toBe(PASS.amountCentavos);
      expect(sent.data.attributes.success_url).toBe("https://app.example/billing?checkout=done");
      const { data } = await adminClient()
        .from("payments")
        .select("status, checkout_id, amount_centavos")
        .eq("user_id", a.id);
      expect(data).toEqual([
        { status: "pending", checkout_id: cs, amount_centavos: PASS.amountCentavos },
      ]);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("refuses guests and never redirects to a non-PayMongo URL", async () => {
    const guest = await newAnonymousUser();
    try {
      session.user = (await adminClient().auth.admin.getUserById(guest.id)).data.user;
      expect(await redirectOf(startCheckout())).toBe("/billing?error=account");
    } finally {
      await deleteUsers(guest);
    }
    session.user = (await adminClient().auth.admin.getUserById(a.id)).data.user;
    fakePayMongo(() =>
      Response.json({
        data: { id: "cs_evil", attributes: { checkout_url: "https://evil.example/" } },
      }),
    );
    try {
      expect(await redirectOf(startCheckout())).toBe("/billing?error=checkout");
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
