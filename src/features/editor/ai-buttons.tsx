"use client";

import { buttonClass } from "@/components/ui";
import { improveBullet, writeSummary } from "@/features/ai/actions";
import { AiNotice, AiOptions, useAiRequest } from "./ai";

/** "✨ Improve" under one bullet (plan 5.4 item form). */
export function ImproveBullet({
  itemId,
  index,
  disabled,
  onUse,
}: {
  itemId: string;
  index: number;
  disabled: boolean;
  onUse: (text: string) => void;
}) {
  const r = useAiRequest();
  if (!r.ai) return null;
  return (
    <div>
      <button
        type="button"
        className={`${buttonClass.ghost} px-2 py-1 text-sm`}
        disabled={disabled || r.pending}
        onClick={() => r.run(() => improveBullet(r.ai!.resumeId, itemId, index))}
        aria-label={`Improve bullet ${index + 1} with AI`}
      >
        {r.pending ? "Thinking…" : "✨ Improve with AI"}
      </button>
      {r.showNotice && <AiNotice />}
      {r.error && <p className="text-sm text-danger">{r.error}</p>}
      {r.options && (
        <AiOptions
          options={r.options}
          onUse={(t) => {
            onUse(t);
            r.setOptions(undefined);
          }}
          onClose={() => r.setOptions(undefined)}
        />
      )}
    </div>
  );
}

/** "✨ Write my summary" from the user's own sections (plan 7.1). */
export function WriteSummary({ onUse }: { onUse: (text: string) => void }) {
  const r = useAiRequest();
  if (!r.ai) return null;
  return (
    <div>
      <button
        type="button"
        className={buttonClass.secondary}
        disabled={r.pending}
        onClick={() => r.run(() => writeSummary(r.ai!.resumeId))}
      >
        {r.pending ? "Writing…" : "✨ Write my summary with AI"}
      </button>
      <p className="mt-1 text-xs text-muted">
        Uses what you&apos;ve entered in your other sections. 1 AI credit.
      </p>
      {r.showNotice && <AiNotice />}
      {r.error && <p className="text-sm text-danger">{r.error}</p>}
      {r.options && (
        <AiOptions
          options={r.options}
          onUse={(t) => {
            onUse(t);
            r.setOptions(undefined);
          }}
          onClose={() => r.setOptions(undefined)}
        />
      )}
    </div>
  );
}
