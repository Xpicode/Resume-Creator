/**
 * The one place to change AI models, effort and prices in credits (plan 7.1 / 7.4).
 * Models follow the plan: a fast, cheap model for quick rewrites, a stronger one for tailoring.
 */

export type AiFeature = "improve_bullet" | "write_summary" | "tailor";

export const AI_FEATURES: Record<
  AiFeature,
  {
    model: string;
    effort: "low" | "medium" | "high";
    maxTokens: number;
    credits: number;
    /** Server-side refusal fallback; only some models support it (Haiku 5.5 does not). */
    fallback: boolean;
  }
> = {
  improve_bullet: {
    model: "claude-haiku-5-5",
    effort: "low",
    maxTokens: 4000,
    credits: 1,
    fallback: false,
  },
  write_summary: {
    model: "claude-haiku-5-5",
    effort: "low",
    maxTokens: 4000,
    credits: 1,
    fallback: false,
  },
  tailor: {
    model: "claude-sonnet-5-5",
    effort: "medium",
    maxTokens: 16000,
    credits: 3,
    fallback: true,
  },
};

/** Keep in sync with public.free_monthly_ai_credits() in supabase/migrations (a test checks it). */
export const FREE_MONTHLY_AI_CREDITS = 10;

/** Per-user cap on AI calls per minute (plan 6.7), on top of credits. */
export const AI_CALLS_PER_MINUTE = 10;

export const MAX_JOB_DESCRIPTION_CHARS = 15000;

export const AI_CONSENT_VERSION = "2026-11-11";
