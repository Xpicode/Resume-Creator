import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

// Small shared UI pieces (plan 5.6 tokens). shadcn/ui can replace these when the app needs Dialog/Sheet/Tabs.

export const inputClass =
  "mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2.5 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export const buttonClass = {
  primary:
    "inline-flex items-center justify-center rounded-lg bg-accent px-5 py-3 font-semibold text-white hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60",
  secondary:
    "inline-flex items-center justify-center rounded-lg border border-border bg-white px-4 py-2.5 font-medium hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60",
  ghost:
    "inline-flex items-center justify-center rounded-lg px-3 py-2 font-medium text-primary hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-40",
  danger:
    "inline-flex items-center justify-center rounded-lg bg-danger px-4 py-2.5 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60",
};

export function Field({
  label,
  id,
  hint,
  error,
  ...input
}: { label: string; id: string; hint?: ReactNode; error?: string } & ComponentProps<"input">) {
  const describedBy =
    [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div>
      <label htmlFor={id} className="block font-medium">
        {label}
      </label>
      <input
        id={id}
        className={inputClass}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...input}
      />
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-sm text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function ConsentCheckbox() {
  return (
    <div className="flex items-start gap-3">
      <input
        id="consent"
        name="consent"
        type="checkbox"
        required
        className="mt-1 size-5 shrink-0 accent-primary"
      />
      <label htmlFor="consent" className="text-sm">
        I agree to the{" "}
        <Link href="/privacy-policy" className="font-medium text-primary underline" target="_blank">
          Privacy Policy
        </Link>{" "}
        and{" "}
        <Link href="/terms" className="font-medium text-primary underline" target="_blank">
          Terms
        </Link>
        .
      </label>
    </div>
  );
}

export function FormMessage({ state }: { state: { status: string; message?: string } }) {
  return (
    <p
      role="status"
      aria-live="polite"
      className={state.status === "success" ? "font-medium text-success" : "text-sm text-danger"}
    >
      {state.status !== "idle" ? state.message : ""}
    </p>
  );
}

export function AuthCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-10">
      <Link href="/" className="text-sm text-primary underline">
        ← Home
      </Link>
      <h1 className="mt-4 text-2xl font-bold">{title}</h1>
      <div className="mt-6">{children}</div>
    </main>
  );
}
