import { beforeEach, describe, expect, it, vi } from "vitest";

const upsert = vi.fn();
const verifyTurnstile = vi.fn();

vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-forwarded-for": "203.0.113.5, 10.0.0.1" }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: () => ({ from: () => ({ upsert }) }),
}));
vi.mock("@/lib/security/turnstile", () => ({ verifyTurnstile }));

const { joinWaitlist } = await import("@/features/waitlist/actions");
const { WAITLIST_CONSENT_VERSION } = await import("@/features/waitlist/schema");

const valid = {
  email: "  Juan.DelaCruz@Example.com ",
  consent: "on",
  source: "fb-group",
  "cf-turnstile-response": "token-123",
};

function without(key: string): Record<string, string> {
  const copy: Record<string, string> = { ...valid };
  delete copy[key];
  return copy;
}

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

describe("joinWaitlist", () => {
  beforeEach(() => {
    upsert.mockReset().mockResolvedValue({ error: null });
    verifyTurnstile.mockReset().mockResolvedValue(true);
  });

  it("saves a valid sign-up with normalized email, source and consent version", async () => {
    const result = await joinWaitlist({ status: "idle" }, form(valid));

    expect(result).toEqual({ status: "success" });
    expect(verifyTurnstile).toHaveBeenCalledWith("token-123", "203.0.113.5");
    expect(upsert).toHaveBeenCalledWith(
      {
        email: "juan.delacruz@example.com",
        source: "fb-group",
        consent_version: WAITLIST_CONSENT_VERSION,
      },
      { onConflict: "email", ignoreDuplicates: true },
    );
  });

  it("rejects an invalid email without calling Turnstile or the database", async () => {
    const result = await joinWaitlist(
      { status: "idle" },
      form({ ...valid, email: "not-an-email" }),
    );

    expect(result.status).toBe("error");
    expect(result.fieldErrors?.email).toBeDefined();
    expect(verifyTurnstile).not.toHaveBeenCalled();
    expect(upsert).not.toHaveBeenCalled();
  });

  it("rejects a missing consent checkbox", async () => {
    const result = await joinWaitlist({ status: "idle" }, form(without("consent")));

    expect(result.fieldErrors?.consent).toBeDefined();
    expect(upsert).not.toHaveBeenCalled();
  });

  it("rejects a failed Turnstile check", async () => {
    verifyTurnstile.mockResolvedValue(false);
    const result = await joinWaitlist({ status: "idle" }, form(valid));

    expect(result.status).toBe("error");
    expect(upsert).not.toHaveBeenCalled();
  });

  it("rejects a missing Turnstile token", async () => {
    const result = await joinWaitlist({ status: "idle" }, form(without("cf-turnstile-response")));

    expect(result.status).toBe("error");
    expect(verifyTurnstile).not.toHaveBeenCalled();
  });

  it("returns the same success for a duplicate email (no account enumeration)", async () => {
    // ignoreDuplicates: Postgres skips the row and returns no error.
    const first = await joinWaitlist({ status: "idle" }, form(valid));
    const second = await joinWaitlist({ status: "idle" }, form(valid));

    expect(second).toEqual(first);
  });

  it("drops a malformed source instead of failing", async () => {
    await joinWaitlist({ status: "idle" }, form({ ...valid, source: "<script>" }));

    expect(upsert.mock.calls[0][0].source).toBeNull();
  });

  it("does not log the email when the database fails", async () => {
    upsert.mockResolvedValue({ error: { code: "XX000", message: "juan.delacruz@example.com" } });
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await joinWaitlist({ status: "idle" }, form(valid));

    expect(result.status).toBe("error");
    expect(JSON.stringify(log.mock.calls)).not.toContain("example.com");
    log.mockRestore();
  });
});
