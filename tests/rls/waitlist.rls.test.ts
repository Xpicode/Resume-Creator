import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

// Runs against a real Supabase project (staging or local) when the env vars are set.
// Proves the browser key can neither read nor write the waitlist (plan 4.3 / 6.3).
const url = process.env.SUPABASE_URL;
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

describe.skipIf(!url || !publishableKey)("waitlist RLS (browser key)", () => {
  const browser = () => createClient(url!, publishableKey!, { auth: { persistSession: false } });

  it("cannot read any rows", async () => {
    const { data, error } = await browser().from("waitlist").select("*");
    // Either an explicit permission error or zero rows — never data.
    expect(error !== null || (data ?? []).length === 0).toBe(true);
  });

  it("cannot insert", async () => {
    const { error } = await browser()
      .from("waitlist")
      .insert({ email: "rls-test@example.com", consent_version: "test" });
    expect(error).not.toBeNull();
  });
});
