import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { appCsp } from "@/lib/security/csp";

/**
 * App pages only: (1) strict nonce CSP (plan 6.6), (2) refresh the Supabase session cookie,
 * because Server Components can't write cookies. Never makes auth decisions (plan 6.3) —
 * every page, action and route checks the user itself.
 */
export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = appCsp(nonce, process.env.NODE_ENV === "development");

  const forward = () => {
    // Rebuilt after any cookie refresh so the page sees the new session.
    const headers = new Headers(request.headers);
    headers.set("x-nonce", nonce);
    headers.set("Content-Security-Policy", csp);
    return NextResponse.next({ request: { headers } });
  };

  let response = forward();
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (url && key) {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(toSet, headers) {
          for (const { name, value } of toSet) request.cookies.set(name, value);
          response = forward();
          for (const { name, value, options } of toSet) response.cookies.set(name, value, options);
          for (const [k, v] of Object.entries(headers ?? {})) response.headers.set(k, v);
        },
      },
    });
    await supabase.auth.getUser();
  }

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
    "/start/:path*",
  ],
};
