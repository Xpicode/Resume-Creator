"use client";

import Link from "next/link";
import { createContext, use, useState, useTransition, type ReactNode } from "react";
import { buttonClass } from "@/components/ui";
import { setAiConsent } from "@/features/ai/actions";
import type { AiBlock } from "@/features/ai/guard";
import type { Option } from "@/features/ai/results";

export type AiState = {
  resumeId: string;
  block: AiBlock | null;
  credits: number;
  setBlock: (b: AiBlock | null) => void;
  setCredits: (n: number) => void;
  /** Save pending edits first: AI reads the saved resume, never text sent from the browser. */
  flush: () => Promise<void>;
};

export const AiContext = createContext<AiState | null>(null);
export const useAi = () => use(AiContext);

export function AiProvider({
  value,
  children,
}: {
  value: Omit<AiState, "setBlock" | "setCredits">;
  children: ReactNode;
}) {
  const [block, setBlock] = useState(value.block);
  const [credits, setCredits] = useState(value.credits);
  return (
    <AiContext value={{ ...value, block, credits, setBlock, setCredits }}>{children}</AiContext>
  );
}

/** Why AI is off, and the one step that turns it on (plan 8 Phase 2 task 10). */
export function AiNotice() {
  const ai = useAi();
  const [pending, start] = useTransition();
  if (!ai?.block) return null;
  const box = "rounded-lg border border-primary/40 bg-primary-soft p-3 text-sm";

  switch (ai.block) {
    case "guest":
      return (
        <p className={box}>
          AI features need a free account.{" "}
          <Link href="/signup" className="font-medium text-primary underline">
            Create one
          </Link>{" "}
          — your resume comes with you.
        </p>
      );
    case "unverified":
      return (
        <p className={box}>Confirm your email address (check your inbox) to use AI features.</p>
      );
    case "unavailable":
    case "auth":
      return (
        <p className={box}>
          AI features aren&apos;t available right now. Everything else works as usual.
        </p>
      );
    case "consent":
      return (
        <div className={box}>
          <p>
            <strong>Turn on AI features?</strong> We send the text of your resume and any job post
            you paste to Anthropic (Claude) to get suggestions. Your name, email, phone, address and
            photo are never sent. The AI only rewords what you wrote, and nothing changes until you
            click “Use this”. You can turn this off in Settings.
          </p>
          <button
            type="button"
            className={`${buttonClass.primary} mt-2 px-3 py-2 text-sm`}
            disabled={pending}
            onClick={() =>
              start(async () => {
                if ((await setAiConsent(true)).ok) ai.setBlock(null);
              })
            }
          >
            Turn on AI features
          </button>
        </div>
      );
  }
}

/** AI options with the honesty warning (plan 7.2) and a "Use this" button. Nothing applies without a click. */
export function AiOptions({
  options,
  onUse,
  onClose,
}: {
  options: Option[];
  onUse: (text: string) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="mt-2 space-y-2 rounded-lg border border-primary/40 bg-white p-3"
      role="region"
      aria-label="AI suggestions"
    >
      {options.map((o, i) => (
        <div key={i} className="rounded-md bg-primary-soft p-2">
          <p className="text-sm">{o.text}</p>
          {o.flags.length > 0 && (
            <p className="mt-1 text-sm font-medium text-danger">
              ⚠ This adds details not in your resume ({o.flags.join(", ")}) — use it only if
              it&apos;s true.
            </p>
          )}
          <button
            type="button"
            className={`${buttonClass.secondary} mt-2 px-3 py-1.5 text-sm`}
            onClick={() => onUse(o.text)}
          >
            Use this
          </button>
        </div>
      ))}
      <button type="button" className={`${buttonClass.ghost} text-sm`} onClick={onClose}>
        Keep mine
      </button>
    </div>
  );
}

/** Runs an AI action with the shared states: notice when blocked, busy, error, credits. */
export function useAiRequest() {
  const ai = useAi();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();
  const [options, setOptions] = useState<Option[]>();
  const [showNotice, setShowNotice] = useState(false);

  function run(
    action: () => Promise<
      | { ok: true; options: Option[]; creditsLeft: number }
      | { ok: false; code: string; message: string }
    >,
  ) {
    if (!ai) return;
    if (ai.block) return setShowNotice(true);
    setError(undefined);
    start(async () => {
      await ai.flush();
      const res = await action();
      if (res.ok) {
        setOptions(res.options);
        ai.setCredits(res.creditsLeft);
      } else {
        if (res.code === "consent" || res.code === "guest" || res.code === "unverified")
          ai.setBlock(res.code);
        setError(res.message);
      }
    });
  }

  return {
    ai,
    pending,
    error,
    options,
    setOptions,
    showNotice: showNotice && Boolean(ai?.block),
    run,
  };
}
