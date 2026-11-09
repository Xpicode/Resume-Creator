"use client";

import { useActionState } from "react";
import { buttonClass, inputClass } from "@/components/ui";
import { redeemCode } from "./code-actions";

export function RedeemForm() {
  const [state, action, pending] = useActionState(redeemCode, null);
  return (
    <form action={action} className="mt-3">
      <label htmlFor="pass-code" className="block font-medium">
        Pass code
      </label>
      <div className="mt-1 flex flex-wrap gap-2">
        <input
          id="pass-code"
          name="code"
          required
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="JHP-XXXX-XXXX-XXXX"
          aria-describedby={state ? "pass-code-error" : undefined}
          className={`${inputClass} mt-0 max-w-xs flex-1 font-mono tracking-wider uppercase`}
        />
        <button type="submit" className={buttonClass.primary} disabled={pending}>
          {pending ? "Checking…" : "Activate"}
        </button>
      </div>
      {state && (
        <p id="pass-code-error" role="alert" className="mt-2 text-sm text-danger">
          {state.message}
        </p>
      )}
    </form>
  );
}
