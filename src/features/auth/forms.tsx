"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Turnstile } from "@/components/turnstile";
import { buttonClass, ConsentCheckbox, Field, FormMessage } from "@/components/ui";
import {
  acceptTerms,
  continueWithGoogle,
  logIn,
  requestPasswordReset,
  setPassword,
  signUpWithEmail,
  startAsGuest,
  type FormState,
} from "./actions";

const idle: FormState = { status: "idle" };

function GoogleButton({ next }: { next?: string }) {
  return (
    <form action={continueWithGoogle}>
      <input type="hidden" name="next" value={next ?? ""} />
      <button type="submit" className={`${buttonClass.secondary} w-full`}>
        Continue with Google
      </button>
    </form>
  );
}

export function StartForm() {
  const [state, action, pending] = useActionState(startAsGuest, idle);
  return (
    <form action={action} className="space-y-5">
      <ConsentCheckbox />
      <Turnstile action="start" resetKey={state} />
      <button type="submit" disabled={pending} className={`${buttonClass.primary} w-full`}>
        {pending ? "Starting…" : "Start my resume"}
      </button>
      <FormMessage state={state} />
    </form>
  );
}

export function SignUpForm({ isGuest }: { isGuest: boolean }) {
  const [state, action, pending] = useActionState(signUpWithEmail, idle);
  if (state.status === "success") return <FormMessage state={state} />;
  return (
    <div className="space-y-6">
      <GoogleButton next="/dashboard" />
      <p className="text-center text-sm text-muted">or with email</p>
      <form action={action} className="space-y-4">
        <Field
          label="Email"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
        />
        <Field
          label="Password"
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
          maxLength={72}
          hint="At least 10 characters."
        />
        <ConsentCheckbox />
        <Turnstile action="signup" resetKey={state} />
        <button type="submit" disabled={pending} className={`${buttonClass.primary} w-full`}>
          {pending ? "Creating…" : isGuest ? "Create account and keep my resume" : "Create account"}
        </button>
        <FormMessage state={state} />
      </form>
      <p className="text-sm">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary underline">
          Log in
        </Link>
      </p>
    </div>
  );
}

export function LoginForm({ next, notice }: { next?: string; notice?: string }) {
  const [state, action, pending] = useActionState(logIn, idle);
  return (
    <div className="space-y-6">
      {notice && <p className="rounded-lg bg-primary-soft p-3 text-sm">{notice}</p>}
      <GoogleButton next={next} />
      <p className="text-center text-sm text-muted">or with email</p>
      <form action={action} className="space-y-4">
        <input type="hidden" name="next" value={next ?? ""} />
        <Field
          label="Email"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
        />
        <Field
          label="Password"
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={72}
        />
        <Turnstile action="login" resetKey={state} />
        <button type="submit" disabled={pending} className={`${buttonClass.primary} w-full`}>
          {pending ? "Logging in…" : "Log in"}
        </button>
        <FormMessage state={state} />
      </form>
      <p className="flex justify-between text-sm">
        <Link href="/forgot-password" className="text-primary underline">
          Forgot password?
        </Link>
        <Link href="/signup" className="text-primary underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, idle);
  if (state.status === "success") return <FormMessage state={state} />;
  return (
    <form action={action} className="space-y-4">
      <Field
        label="Email"
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
        maxLength={254}
      />
      <Turnstile action="reset" resetKey={state} />
      <button type="submit" disabled={pending} className={`${buttonClass.primary} w-full`}>
        {pending ? "Sending…" : "Send reset link"}
      </button>
      <FormMessage state={state} />
    </form>
  );
}

export function SetPasswordForm() {
  const [state, action, pending] = useActionState(setPassword, idle);
  return (
    <form action={action} className="space-y-4">
      <Field
        label="New password"
        id="password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={10}
        maxLength={72}
        hint="At least 10 characters."
      />
      <Field
        label="Confirm password"
        id="confirm"
        name="confirm"
        type="password"
        autoComplete="new-password"
        required
        maxLength={72}
      />
      <button type="submit" disabled={pending} className={`${buttonClass.primary} w-full`}>
        {pending ? "Saving…" : "Save password"}
      </button>
      <FormMessage state={state} />
    </form>
  );
}

export function ConsentForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(acceptTerms, idle);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <ConsentCheckbox />
      <button type="submit" disabled={pending} className={`${buttonClass.primary} w-full`}>
        Continue
      </button>
      <FormMessage state={state} />
    </form>
  );
}
