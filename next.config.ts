import type { NextConfig } from "next";
import { marketingCsp, marketingSource, SECURITY_HEADERS } from "./src/lib/security/csp";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  // Native modules used for the preview image and photo processing; must not be bundled.
  serverExternalPackages: ["@napi-rs/canvas", "sharp"],
  // PDF fonts are read from disk at render time; make sure deploys include them.
  outputFileTracingIncludes: {
    "/api/resumes/**": ["./src/pdf/fonts/**"],
    "/template-previews/**": ["./src/pdf/fonts/**"],
    "/r/**": ["./src/pdf/fonts/**"],
  },
  experimental: {
    // Photo uploads go through a Server Action: 5 MB file + form overhead (plan 6.5).
    serverActions: { bodySizeLimit: "6mb" },
  },
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
