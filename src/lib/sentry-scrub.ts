import type { ErrorEvent } from "@sentry/nextjs";

/**
 * PII scrubbing for Sentry (plan 6.8): no request bodies, cookies, headers or user, and only
 * navigation/network breadcrumbs reduced to URL + status. Resume text must never reach Sentry.
 */
export function scrubEvent(event: ErrorEvent): ErrorEvent {
  if (event.request) {
    delete event.request.data;
    delete event.request.cookies;
    delete event.request.headers;
    delete event.request.query_string;
  }
  delete event.user;
  event.breadcrumbs = event.breadcrumbs
    ?.filter((b) => b.category === "navigation" || b.category === "fetch" || b.category === "xhr")
    .map((b) => ({
      category: b.category,
      timestamp: b.timestamp,
      data: { url: b.data?.url ?? b.data?.to, status_code: b.data?.status_code },
    }));
  return event;
}

export const sentryOptions = (dsn: string) => ({
  dsn,
  sendDefaultPii: false,
  tracesSampleRate: 0,
  beforeSend: scrubEvent,
});
