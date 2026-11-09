import { NextResponse, type NextRequest } from "next/server";
import { appCsp } from "@/lib/security/csp";

/**
 * Sets the strict nonce CSP on app pages only (plan Section 6.6).
 * Session refresh is added here in Phase 1. Never make auth decisions here (Section 6.3).
 */
export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = appCsp(nonce, process.env.NODE_ENV === "development");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

// Must be literal constants (Next.js analyzes them at build time).
// Keep in sync with APP_PATH_PREFIXES in src/lib/security/csp.ts — tests/unit/csp.test.ts checks it.
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/resumes/:path*",
    "/settings/:path*",
    "/billing/:path*",
    "/onboarding/:path*",
    "/login/:path*",
    "/signup/:path*",
    "/forgot-password/:path*",
    "/auth/:path*",
  ],
};
