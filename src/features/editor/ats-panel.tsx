"use client";

import { useState, useTransition } from "react";
import { buttonClass } from "@/components/ui";
import { checkAts } from "@/features/ai/actions";
import type { AtsItem, AtsResult } from "@/features/ats/check";

/** Opens and scrolls to a section in the editor ("Fix" buttons). */
export function jumpTo(target?: string) {
  if (!target) return;
  const el = document.getElementById(target);
  if (!el) return;
  if (el instanceof HTMLDetailsElement) el.open = true;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  el.querySelector<HTMLElement>("input, textarea, select")?.focus({ preventScroll: true });
}

export function AtsChecklist({
  result,
  onFix,
}: {
  result: AtsResult;
  onFix?: (item: AtsItem) => void;
}) {
  return (
    <div>
      <p className="text-lg font-bold">ATS score: {result.score}/100</p>
      <ul className="mt-2 space-y-2">
        {result.items.map((item) => (
          <li key={item.id} className="flex items-start gap-2 text-sm">
            {/* Icon + words, never colour alone (plan 5.7). */}
            <span aria-hidden className={item.ok ? "text-success" : "text-danger"}>
              {item.ok ? "✓" : "✗"}
            </span>
            <span className="flex-1">
              <span className="font-medium">
                <span className="sr-only">{item.ok ? "Passed: " : "Needs work: "}</span>
                {item.title}
              </span>{" "}
              — {item.detail}
            </span>
            {!item.ok && item.target && onFix && (
              <button
                type="button"
                className={`${buttonClass.ghost} px-2 py-0.5 text-sm`}
                onClick={() => onFix(item)}
              >
                Fix
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Rule-based ATS check in the editor (plan 7.5). Free, no AI, available to guests. */
export function AtsPanel({ resumeId, flush }: { resumeId: string; flush: () => Promise<void> }) {
  const [result, setResult] = useState<AtsResult>();
  const [error, setError] = useState(false);
  const [pending, start] = useTransition();

  return (
    <details id="ats" className="group rounded-xl border border-border/60 bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between p-4 font-semibold">
        ATS check (free)
        <span aria-hidden className="text-muted transition group-open:rotate-180">
          ▾
        </span>
      </summary>
      <div className="space-y-3 border-t border-border/40 p-4">
        <p className="text-sm text-muted">
          Checks the things applicant tracking systems on JobStreet, Indeed and company sites look
          for.
        </p>
        <button
          type="button"
          className={buttonClass.secondary}
          disabled={pending}
          onClick={() =>
            start(async () => {
              await flush();
              const res = await checkAts(resumeId);
              setError(!res.ok);
              if (res.ok) setResult(res.result);
            })
          }
        >
          {pending ? "Checking…" : result ? "Check again" : "Run ATS check"}
        </button>
        {error && <p className="text-sm text-danger">Couldn&apos;t run the check. Try again.</p>}
        {result && <AtsChecklist result={result} onFix={(item) => jumpTo(item.target)} />}
      </div>
    </details>
  );
}
