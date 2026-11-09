"use client";

import Link from "next/link";
import Script from "next/script";
import { useActionState, useCallback, useEffect, useRef } from "react";
import { joinWaitlist, type WaitlistState } from "./actions";

declare global {
  interface Window {
    turnstile?: {
      render(el: HTMLElement, options: { sitekey: string; action?: string }): string;
      reset(widgetId?: string): void;
      remove(widgetId: string): void;
    };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
const initialState: WaitlistState = { status: "idle" };

export function WaitlistForm() {
  const [state, formAction, pending] = useActionState(joinWaitlist, initialState);
  const widgetRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | undefined>(undefined);
  const sourceRef = useRef<HTMLInputElement>(null);

  const renderWidget = useCallback(() => {
    if (!widgetRef.current || !window.turnstile || widgetId.current) return;
    widgetId.current = window.turnstile.render(widgetRef.current, {
      sitekey: SITE_KEY,
      action: "waitlist",
    });
  }, []);

  useEffect(() => {
    // Channel tag from the shared link, e.g. ?src=fb-group
    if (sourceRef.current) {
      sourceRef.current.value = new URLSearchParams(window.location.search).get("src") ?? "";
    }
    renderWidget();
    return () => {
      if (widgetId.current) window.turnstile?.remove(widgetId.current);
      widgetId.current = undefined;
    };
  }, [renderWidget]);

  // Turnstile tokens are single-use: get a fresh one after a failed attempt.
  useEffect(() => {
    if (state.status === "error" && widgetId.current) window.turnstile?.reset(widgetId.current);
  }, [state]);

  if (state.status === "success") {
    return (
      <p role="status" className="rounded-lg bg-white p-4 font-medium text-success">
        You&apos;re on the list! We&apos;ll email you when the app is ready.
      </p>
    );
  }

  const emailError = state.fieldErrors?.email;
  const consentError = state.fieldErrors?.consent;

  return (
    <form action={formAction} noValidate className="mt-4 space-y-4">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={renderWidget}
      />
      <input ref={sourceRef} type="hidden" name="source" />

      <div>
        <label htmlFor="email" className="block font-medium">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          maxLength={254}
          defaultValue={state.email}
          placeholder="e.g., juan.delacruz@gmail.com"
          aria-invalid={emailError ? true : undefined}
          aria-describedby={emailError ? "email-error" : undefined}
          className="mt-1 block w-full rounded-lg border border-border bg-white px-3 py-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        />
        {emailError && (
          <p id="email-error" className="mt-1 text-sm text-danger">
            {emailError}
          </p>
        )}
      </div>

      <div>
        <div className="flex items-start gap-3">
          <input
            id="consent"
            name="consent"
            type="checkbox"
            required
            aria-invalid={consentError ? true : undefined}
            aria-describedby={consentError ? "consent-error" : undefined}
            className="mt-1 size-5 shrink-0 accent-primary"
          />
          <label htmlFor="consent" className="text-sm">
            I agree to the{" "}
            <Link href="/privacy" className="font-medium text-primary underline">
              Privacy Notice
            </Link>
            . We&apos;ll only use my email to tell me when the app launches.
          </label>
        </div>
        {consentError && (
          <p id="consent-error" className="mt-1 text-sm text-danger">
            {consentError}
          </p>
        )}
      </div>

      <div ref={widgetRef} />

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-accent px-5 py-3 text-base font-semibold text-white hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60 sm:w-auto"
      >
        {pending ? "Joining…" : "Join the waitlist"}
      </button>

      <p role="status" aria-live="polite" className="text-sm text-danger">
        {state.status === "error" ? state.message : ""}
      </p>
    </form>
  );
}
