import type { MetadataRoute } from "next";
import { APP_PATH_PREFIXES } from "@/lib/security/csp";
import { SITE_URL } from "@/lib/site";

// Public pages only; the app, auth and API stay out of search engines.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: [...APP_PATH_PREFIXES, "/api/"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
