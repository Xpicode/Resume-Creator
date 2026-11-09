// Placeholder until the product name is decided (plan Section 15, decision 1).
export const SITE_NAME = "PH Resume Builder";

// TODO before sharing the waitlist link: replace with the real Data Protection Officer contact (plan 6.9).
export const PRIVACY_EMAIL = "privacy@example.com";

// TODO before the beta: a real inbox you check daily (plan Phase 3C task 16).
export const SUPPORT_EMAIL = "support@example.com";

/** Public URL for sitemap, Open Graph and canonical links. Set NEXT_PUBLIC_SITE_URL in production. */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// TODO before selling: how customers pay you directly (shown on the Billing page).
export const DIRECT_PAYMENT = {
  method: "GCash",
  account: "09XX XXX XXXX (your name) — set this in src/lib/site.ts",
};
