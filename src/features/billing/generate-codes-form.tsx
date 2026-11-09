"use client";

import { useActionState, useState } from "react";
import { buttonClass, inputClass } from "@/components/ui";
import { generateCodes } from "./code-actions";

export function GenerateCodesForm() {
  const [state, action, pending] = useActionState(generateCodes, null);
  const [copied, setCopied] = useState(false);
  const codes = state?.codes ?? [];

  return (
    <div>
      <form action={action} className="grid gap-3 sm:grid-cols-[8rem_1fr_auto] sm:items-end">
        <div>
          <label htmlFor="count" className="block font-medium">
            How many
          </label>
          <input
            id="count"
            name="count"
            type="number"
            min={1}
            max={50}
            defaultValue={1}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="note" className="block font-medium">
            Note (optional)
          </label>
          <input
            id="note"
            name="note"
            maxLength={200}
            placeholder="e.g. Juan D. · GCash ref 1234567890"
            className={inputClass}
          />
        </div>
        <button type="submit" className={buttonClass.primary} disabled={pending}>
          {pending ? "Creating…" : "Generate"}
        </button>
      </form>

      {state?.error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {state.error}
        </p>
      )}
      {codes.length > 0 && (
        <div role="status" className="mt-4 rounded-lg border-2 border-primary bg-primary-soft p-4">
          <p className="font-semibold">
            {codes.length === 1 ? "Your new code" : `Your ${codes.length} new codes`} — copy now
          </p>
          <p className="text-sm text-muted">
            For security we only keep a fingerprint of each code. Once you leave this page you
            can&apos;t see them again (you can always generate new ones).
          </p>
          <pre className="mt-3 overflow-x-auto rounded bg-white p-3 font-mono text-lg tracking-wider">
            {codes.join("\n")}
          </pre>
          <button
            type="button"
            className={`${buttonClass.secondary} mt-3`}
            onClick={async () => {
              await navigator.clipboard.writeText(codes.join("\n"));
              setCopied(true);
            }}
          >
            {copied ? "Copied ✓" : "Copy"}
          </button>
        </div>
      )}
    </div>
  );
}
