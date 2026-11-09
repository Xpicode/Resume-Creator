import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Per-user limits for the heavy endpoints (plan 6.7). Preview fires ~1.4 s after typing stops
 * (autosave 0.8 s + preview 0.6 s), so 60/minute never bothers a real user.
 * Per-IP limits on top of these are Vercel Firewall rules (README → Before staging / production).
 */
export const RATE_LIMITS = {
  preview: { max: 60, seconds: 60 },
  pdf: { max: 30, seconds: 60 * 60 },
  photo: { max: 10, seconds: 60 * 60 },
  export: { max: 3, seconds: 24 * 60 * 60 },
  // PDF downloads from a public share link, counted against the resume's owner.
  share_pdf: { max: 60, seconds: 60 * 60 },
  // Pass-code attempts (codes are unguessable; this stops brute force cold).
  redeem: { max: 10, seconds: 60 * 60 },
} as const;

export type RateLimitedAction = keyof typeof RATE_LIMITS;

/**
 * True if the user may go ahead (and counts this request), false if over the limit.
 * ponytail: fails open if the database check itself errors — a limiter outage shouldn't block
 * people from their own resumes. Switch to fail-closed if abuse ever shows up during outages.
 */
export async function takeRateLimit(userId: string, action: RateLimitedAction): Promise<boolean> {
  const { max, seconds } = RATE_LIMITS[action];
  const { data, error } = await supabaseAdmin().rpc("hit_rate_limit", {
    uid: userId,
    action_name: action,
    max_hits: max,
    window_seconds: seconds,
  });
  if (error) {
    console.error("rate limit check failed", error.code);
    return true;
  }
  return data === true;
}

/** 429 for API routes, with a plain message (downloads show it as a page). */
export function tooManyRequests(action: RateLimitedAction): Response {
  return new Response("Too many requests. Please wait a few minutes and try again.", {
    status: 429,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "private, no-store",
      "Retry-After": String(RATE_LIMITS[action].seconds),
    },
  });
}
