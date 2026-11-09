/**
 * Security headers and Content-Security-Policy (plan Section 6.6).
 *
 * - App pages (logged-in area + auth pages): strict CSP with a per-request nonce, set in src/proxy.ts.
 * - Marketing pages: CSP without nonces, set in next.config.ts, so they stay static and fast.
 */

/** Route prefixes that get the strict nonce CSP. Keep in sync with `config.matcher` in src/proxy.ts (a test checks this). */
export const APP_PATH_PREFIXES = [
  "/dashboard",
  "/resumes",
  "/settings",
  "/billing",
  "/onboarding",
  "/login",
  "/signup",
  "/forgot-password",
  "/auth",
] as const;

const TURNSTILE_ORIGIN = "https://challenges.cloudflare.com";

function join(directives: string[]): string {
  return directives.join("; ");
}

function shared(isDev: boolean): string[] {
  return [
    "default-src 'self'",
    "img-src 'self' blob: data:",
    "font-src 'self'",
    "connect-src 'self'",
    `frame-src ${TURNSTILE_ORIGIN}`,
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ];
}

/** CSP for static marketing pages. Inline scripts are allowed because Next.js needs them without nonces. */
export function marketingCsp(isDev: boolean): string {
  return join([
    `script-src 'self' 'unsafe-inline' ${TURNSTILE_ORIGIN}${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    ...shared(isDev),
  ]);
}

/** Strict CSP for app pages. Requires the page to render dynamically (it will: it reads the session). */
export function appCsp(nonce: string, isDev: boolean): string {
  return join([
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${TURNSTILE_ORIGIN}${isDev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' ${isDev ? "'unsafe-inline'" : `'nonce-${nonce}'`}`,
    ...shared(isDev),
  ]);
}

/** Headers for every response. */
export const SECURITY_HEADERS = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

/** next.config `headers()` source that matches every path EXCEPT the app prefixes. */
export function marketingSource(): string {
  const names = APP_PATH_PREFIXES.map((p) => p.slice(1)).join("|");
  return `/((?!(?:${names})(?:/|$)).*)`;
}
