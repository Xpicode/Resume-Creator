"use client";

import { useActionState } from "react";
import { buttonClass, Field } from "@/components/ui";
import { deleteAccount, type DeleteState } from "./actions";

export function DeleteAccountForm() {
  const [state, action, pending] = useActionState(deleteAccount, { status: "idle" } as DeleteState);
  return (
    <form action={action} className="mt-4 space-y-3">
      <Field
        label="Type DELETE to confirm"
        id="confirm"
        name="confirm"
        autoComplete="off"
        required
        maxLength={10}
        error={state.status === "error" ? state.message : undefined}
      />
      <button type="submit" disabled={pending} className={buttonClass.danger}>
        {pending ? "Deleting…" : "Delete my account and all my data"}
      </button>
    </form>
  );
}
