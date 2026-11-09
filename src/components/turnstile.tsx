"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef } from "react";

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

/**
 * Cloudflare Turnstile. Must sit inside a <form>: it adds a hidden `cf-turnstile-response` field.
 * Tokens are single-use, so change `resetKey` after every failed submit to get a fresh one.
 */
export function Turnstile({ action, resetKey }: { action: string; resetKey?: unknown }) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | undefined>(undefined);

  const render = useCallback(() => {
    if (!ref.current || !window.turnstile || widgetId.current) return;
    widgetId.current = window.turnstile.render(ref.current, { sitekey: SITE_KEY, action });
  }, [action]);

  useEffect(() => {
    render();
    return () => {
      if (widgetId.current) window.turnstile?.remove(widgetId.current);
      widgetId.current = undefined;
    };
  }, [render]);

  useEffect(() => {
    if (resetKey !== undefined && widgetId.current) window.turnstile?.reset(widgetId.current);
  }, [resetKey]);

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={render}
      />
      <div ref={ref} />
    </>
  );
}
