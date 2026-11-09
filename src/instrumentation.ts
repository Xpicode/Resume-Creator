import * as Sentry from "@sentry/nextjs";
import { sentryOptions } from "@/lib/sentry-scrub";

// Server-side error tracking (plan Phase 3B). Off unless NEXT_PUBLIC_SENTRY_DSN is set.
export function register() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (dsn) Sentry.init(sentryOptions(dsn));
}

export const onRequestError = Sentry.captureRequestError;
