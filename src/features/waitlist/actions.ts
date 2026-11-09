"use server";

import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyTurnstile } from "@/lib/security/turnstile";
import { WAITLIST_CONSENT_VERSION, waitlistSchema } from "./schema";

export type WaitlistState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: { email?: string; consent?: string };
  /** Echoed back so the field is not emptied after an error. */
  email?: string;
};

function field(formData: FormData, name: string): string | undefined {
  const value = formData.get(name);
  return typeof value === "string" ? value : undefined;
}

export async function joinWaitlist(
  _prev: WaitlistState,
  formData: FormData,
): Promise<WaitlistState> {
  const email = field(formData, "email")?.slice(0, 300);

  // Pick known fields only; FormData can carry framework fields we must not trust or pass on.
  const parsed = waitlistSchema.safeParse({
    email,
    consent: field(formData, "consent"),
    source: field(formData, "source") || undefined,
    token: field(formData, "cf-turnstile-response"),
  });

  if (!parsed.success) {
    const failed = new Set(parsed.error.issues.map((issue) => issue.path[0]));
    const fieldErrors: WaitlistState["fieldErrors"] = {};
    if (failed.has("email")) fieldErrors.email = "Enter a valid email address.";
    if (failed.has("consent")) fieldErrors.consent = "Please agree to the Privacy Notice.";
    const message = failed.has("token")
      ? "Please wait for the security check to finish, then try again."
      : "Please fix the highlighted fields.";
    return { status: "error", message, fieldErrors, email };
  }

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || undefined;
  if (!(await verifyTurnstile(parsed.data.token, ip))) {
    return { status: "error", message: "Security check failed. Please try again.", email };
  }

  // Duplicate emails are ignored silently: same success message, so nobody can test who signed up.
  const { error } = await supabaseAdmin()
    .from("waitlist")
    .upsert(
      {
        email: parsed.data.email,
        source: parsed.data.source ?? null,
        consent_version: WAITLIST_CONSENT_VERSION,
      },
      { onConflict: "email", ignoreDuplicates: true },
    );

  if (error) {
    // Error code only — never log the email.
    console.error("waitlist insert failed", error.code);
    return {
      status: "error",
      message: "Something went wrong on our side. Please try again.",
      email,
    };
  }

  return { status: "success" };
}
