import type { SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { adminClient, browserClient, hasDb } from "./helpers";

// /admin-login: admins get in; everyone else is signed straight back out with the same message.
const ADMIN = `admin-${crypto.randomUUID()}@example.com`;
const CUSTOMER = `customer-${crypto.randomUUID()}@example.com`;
const PASSWORD = `pw-${crypto.randomUUID()}`;
process.env.ADMIN_EMAILS = ADMIN;

let client: SupabaseClient;
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => client }));

const { adminLogIn } = await import("@/features/auth/actions");

async function attempt(email: string, password: string) {
  client = browserClient();
  const fd = new FormData();
  fd.set("email", email);
  fd.set("password", password);
  try {
    return await adminLogIn({ status: "idle" }, fd);
  } catch (e) {
    const digest = String((e as { digest?: string }).digest ?? "");
    if (digest.startsWith("NEXT_REDIRECT")) return `redirect:${digest.split(";")[2]}`;
    throw e;
  }
}

const signedIn = async () => Boolean((await client.auth.getSession()).data.session);
const REFUSED = {
  status: "error",
  message: "Wrong email or password, or this account can't open the admin area.",
};

describe.skipIf(!hasDb)("admin login", () => {
  const ids: string[] = [];
  beforeAll(async () => {
    for (const email of [ADMIN, CUSTOMER]) {
      const { data } = await adminClient().auth.admin.createUser({
        email,
        password: PASSWORD,
        email_confirm: true,
      });
      ids.push(data.user!.id);
    }
  });
  afterAll(async () => {
    for (const id of ids) await adminClient().auth.admin.deleteUser(id);
  });

  it("lets an admin in and sends them to /admin", async () => {
    expect(await attempt(ADMIN, PASSWORD)).toBe("redirect:/admin");
    expect(await signedIn()).toBe(true);
  });

  it("refuses a normal account and signs it straight back out", async () => {
    expect(await attempt(CUSTOMER, PASSWORD)).toEqual(REFUSED);
    expect(await signedIn()).toBe(false);
  });

  it("gives a wrong password the same message (can't be used to find admin emails)", async () => {
    expect(await attempt(ADMIN, "wrong-password")).toEqual(REFUSED);
    expect(await attempt(`nobody-${crypto.randomUUID()}@example.com`, PASSWORD)).toEqual(REFUSED);
  });

  it("rejects empty input", async () => {
    expect(await attempt("", "")).toEqual({
      status: "error",
      message: "Enter your email and password.",
    });
  });
});
