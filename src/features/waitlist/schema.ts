import { z } from "zod";

/** Bump when the Privacy Notice changes; stored with each sign-up. */
export const WAITLIST_CONSENT_VERSION = "waitlist-2026-11-09";

export const waitlistSchema = z.strictObject({
  email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
  consent: z.literal("on"),
  // Channel tag from ?src= (e.g. "fb-group"). Anything malformed is dropped, not rejected.
  source: z
    .string()
    .regex(/^[a-z0-9-]{1,50}$/)
    .optional()
    .catch(undefined),
  token: z.string().min(1).max(2048),
});

export type WaitlistInput = z.infer<typeof waitlistSchema>;
