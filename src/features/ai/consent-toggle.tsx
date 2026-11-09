"use client";

import { useState, useTransition } from "react";
import { setAiConsent } from "./actions";

/** Settings → AI processing on/off (plan 8 Phase 2 task 10). */
export function AiConsentToggle({ initial }: { initial: boolean }) {
  const [on, setOn] = useState(initial);
  const [pending, start] = useTransition();
  return (
    <label className="mt-3 flex items-center gap-3">
      <input
        type="checkbox"
        role="switch"
        checked={on}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.checked;
          start(async () => {
            if ((await setAiConsent(next)).ok) setOn(next);
          });
        }}
        className="size-5 accent-primary"
      />
      <span>
        AI features are <strong>{on ? "on" : "off"}</strong>
      </span>
    </label>
  );
}
