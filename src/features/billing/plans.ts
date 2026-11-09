import { FREE_MONTHLY_AI_CREDITS } from "@/features/ai/config";

/**
 * Plans (plan Section 10). Prices live only here, on the server — the browser never sends an amount.
 * Hypotheses: check against the break-even in plan 10.1 after the beta (plan Section 15, decision 2).
 */
export const PASS = {
  plan: "pass_30d",
  name: "Job Hunt Pass",
  amountCentavos: 9900, // ₱99
  days: 30,
  aiCredits: 100, // ≈ 33 tailorings; at ~$0.009/call that's well under the 25% AI-cost budget
  resumeLimit: 50, // keep in sync with resume_limit() in supabase/migrations/20261112000000_billing.sql
} as const;

export const FREE = { resumeLimit: 1, aiCredits: FREE_MONTHLY_AI_CREDITS } as const;

export const peso = (centavos: number) =>
  `₱${(centavos / 100).toLocaleString("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
