"use client";

import type { Step } from "./progress";

const MESSAGES: [number, string][] = [
  [100, "All done — your resume is complete!"],
  [80, "Almost there — looking good!"],
  [50, "Halfway there. Keep going!"],
  [1, "Good start."],
  [0, "Let's start with your name and contact details."],
];

/** Progress bar + one chip per step. Chips jump to that step; ✓ marks finished ones. */
export function StepsBar({
  steps,
  percent,
  openId,
  onOpen,
}: {
  steps: Step[];
  percent: number;
  openId: string | null;
  onOpen: (id: string) => void;
}) {
  const message = MESSAGES.find(([min]) => percent >= min)![1];
  return (
    <div className="rounded-2xl border border-border/40 bg-white p-4 shadow-[0_10px_30px_-24px_rgb(30_58_138/0.6)]">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-[family-name:var(--font-bricolage)] text-lg font-bold">
          Your resume is <span className="text-primary">{percent}%</span> done
        </p>
        <p className="hidden text-sm text-muted sm:block">{message}</p>
      </div>
      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Resume progress"
        className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100"
      >
        <div
          className="progress-fill h-full rounded-full bg-gradient-to-r from-primary to-sky-500"
          style={{ width: `${Math.max(percent, 3)}%` }}
        />
      </div>
      <p className="mt-2 text-sm text-muted sm:hidden">{message}</p>

      <nav
        aria-label="Resume sections"
        className="-mx-1 mt-3 overflow-x-auto pb-1 [scrollbar-width:none] sm:overflow-visible [&::-webkit-scrollbar]:hidden"
      >
        <ol className="flex gap-2 px-1 sm:flex-wrap">
          {steps.map((s) => {
            const current = s.id === openId;
            return (
              <li key={s.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => onOpen(s.id)}
                  aria-current={current ? "step" : undefined}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
                    current
                      ? "border-primary bg-primary text-white"
                      : s.done
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : s.hidden
                          ? "border-border/40 bg-white text-muted line-through"
                          : "border-border/50 bg-white text-foreground hover:border-primary/50"
                  }`}
                >
                  <span aria-hidden="true">{s.icon}</span>
                  {s.label}
                  {s.done && (
                    <span
                      aria-label="done"
                      className={`step-check ${current ? "" : "text-emerald-600"}`}
                    >
                      ✓
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
