import type { NextConfig } from "next";
import { marketingCsp, marketingSource, SECURITY_HEADERS } from "./src/lib/security/csp";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  // Native canvas used by the Phase 0 preview spike; must not be bundled.
  serverExternalPackages: ["@napi-rs/canvas"],
  // PDF fonts are read from disk at render time; make sure deploys include them.
  outputFileTracingIncludes: { "/spike/preview/**": ["./src/pdf/fonts/**"] },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
      // App pages get their nonce CSP from src/proxy.ts instead.
      {
        source: marketingSource(),
        headers: [{ key: "Content-Security-Policy", value: marketingCsp(isDev) }],
      },
    ];
  },
};

export default nextConfig;
