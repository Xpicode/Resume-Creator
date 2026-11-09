import { describe, expect, it } from "vitest";
import { createMergeTicket, readMergeTicket } from "@/features/auth/merge-ticket";
import { safeNext } from "@/lib/auth";

const secret = "test-secret-test-secret-test-secret-0000";

describe("merge ticket", () => {
  it("round-trips a guest id", () => {
    expect(readMergeTicket(createMergeTicket("guest-1", secret), secret)).toBe("guest-1");
  });

  it("rejects tampering, a wrong secret and expiry", () => {
    const ticket = createMergeTicket("guest-1", secret);
    const [payload, sig] = ticket.split(".");
    const forged = Buffer.from(
      JSON.stringify({ anon: "victim", exp: Date.now() + 60_000 }),
    ).toString("base64url");
    expect(readMergeTicket(`${forged}.${sig}`, secret)).toBeNull();
    // Always change the first character (swapping in a fixed "x" was a no-op 1 time in 64).
    const tampered = `${sig[0] === "x" ? "y" : "x"}${sig.slice(1)}`;
    expect(readMergeTicket(`${payload}.${tampered}`, secret)).toBeNull();
    expect(readMergeTicket(ticket, "another-secret-another-secret-00000")).toBeNull();
    expect(readMergeTicket(ticket, secret, Date.now() + 61 * 60_000)).toBeNull();
    expect(readMergeTicket(undefined, secret)).toBeNull();
    expect(readMergeTicket("garbage", secret)).toBeNull();
  });
});

describe("safeNext", () => {
  it("allows same-site paths only", () => {
    expect(safeNext("/resumes/abc/edit")).toBe("/resumes/abc/edit");
    expect(safeNext("/settings?reauth=1")).toBe("/settings?reauth=1");
    for (const bad of [
      "//evil.com",
      "/\\evil.com",
      "https://evil.com",
      "javascript:alert(1)",
      "",
      null,
      "/a b",
    ]) {
      expect(safeNext(bad)).toBe("/dashboard");
    }
  });
});
