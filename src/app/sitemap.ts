import type { MetadataRoute } from "next";
import { POSTS } from "@/features/blog/posts";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["/", "/blog", "/privacy-policy", "/terms", "/refund-policy"];
  return [
    ...pages.map((path) => ({ url: `${SITE_URL}${path}` })),
    ...POSTS.map((p) => ({ url: `${SITE_URL}/blog/${p.slug}`, lastModified: p.date })),
  ];
}
