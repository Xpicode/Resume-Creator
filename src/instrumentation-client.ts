import { sentryOptions } from "@/lib/sentry-scrub";

// Browser error tracking, loaded only when a DSN is set so phones don't download it otherwise.
// No Session Replay (plan 6.8: never record what users type into the editor).
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
if (dsn) {
  void import("@sentry/nextjs").then((Sentry) =>
    Sentry.init({
      ...sentryOptions(dsn),
      integrations: (defaults) => defaults.filter((i) => i.name !== "Replay"),
    }),
  );
}
