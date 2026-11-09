import "server-only";
import { z } from "zod";

const serverEnvSchema = z.object({
  SUPABASE_URL: z.url(),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(20),
  SUPABASE_SECRET_KEY: z.string().min(20),
  TURNSTILE_SECRET_KEY: z.string().min(10),
  MERGE_TICKET_SECRET: z.string().min(32),
  // Only the cleanup cron route needs it; that route refuses to run without it.
  CRON_SECRET: z.string().min(16).optional(),
  // AI features show "not available" without it (plan 7). Server only.
  ANTHROPIC_API_KEY: z.string().min(20).optional(),
  // Payments show "not available" without both (plan Phase 3A). sk_test_… or sk_live_…; whsk_…
  PAYMONGO_SECRET_KEY: z
    .string()
    .regex(/^sk_(test|live)_/)
    .optional(),
  PAYMONGO_WEBHOOK_SECRET: z.string().min(10).optional(),
  // Comma-separated emails that can open /admin (pass codes). Empty = no admins.
  ADMIN_EMAILS: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | undefined;

/**
 * Validated server-only environment. Parsed on first use (not at import) so
 * `next build` works in CI without real secrets; a missing var fails loudly at runtime.
 */
export function serverEnv(): ServerEnv {
  if (!cached) {
    const parsed = serverEnvSchema.safeParse(process.env);
    if (!parsed.success) {
      // Names only — never print values.
      const names = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
      throw new Error(`Missing or invalid environment variables: ${names}`);
    }
    cached = parsed.data;
  }
  return cached;
}
