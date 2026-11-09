import "server-only";
import { z } from "zod";

const serverEnvSchema = z.object({
  SUPABASE_URL: z.url(),
  SUPABASE_SECRET_KEY: z.string().min(20),
  TURNSTILE_SECRET_KEY: z.string().min(10),
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
