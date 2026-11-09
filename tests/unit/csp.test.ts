import { describe, expect, it } from "vitest";
import { APP_PATH_PREFIXES, appCsp, marketingCsp, marketingSource } from "@/lib/security/csp";
import { config } from "@/proxy";

describe("CSP", () => {
  it("proxy matcher covers exactly the app prefixes", () => {
    expect(config.matcher).toEqual(APP_PATH_PREFIXES.map((p) => `${p}/:path*`));
  });

  it("marketing source excludes app prefixes but not look-alike paths", () => {
    const re = new RegExp(`^${marketingSource()}$`);
    for (const p of APP_PATH_PREFIXES) {
      expect(re.test(p)).toBe(false);
      expect(re.test(`${p}/x`)).toBe(false);
    }
    for (const p of ["/", "/privacy", "/dashboard-tips", "/blog/login-guide"]) {
      expect(re.test(p)).toBe(true);
    }
  });

  it("app CSP in production uses the nonce and allows no inline or eval", () => {
    const csp = appCsp("abc123", false);
    expect(csp).toContain("'nonce-abc123'");
    expect(csp).not.toContain("unsafe-inline");
    expect(csp).not.toContain("unsafe-eval");
    expect(csp).toContain("frame-ancestors 'none'");
  });

  it("marketing CSP in production blocks eval and framing", () => {
    const csp = marketingCsp(false);
    expect(csp).not.toContain("unsafe-eval");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
  });
});
