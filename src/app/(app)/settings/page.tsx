import type { Metadata } from "next";
import Link from "next/link";
import { buttonClass } from "@/components/ui";
import { DeleteAccountForm } from "@/features/account/delete-account-form";
import { AiConsentToggle } from "@/features/ai/consent-toggle";
import { creditsLeft, hasAiConsent } from "@/features/ai/guard";
import { hasRecentLogin, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Settings" };

const CONSENT_LABELS: Record<string, string> = {
  privacy_policy: "Privacy Policy",
  terms: "Terms",
  ai_processing: "AI processing",
  marketing: "Marketing emails",
};
const fmt = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeZone: "Asia/Manila" });

export default async function SettingsPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: consents } = await supabase
    .from("consents")
    .select("consent_type, version, granted_at, withdrawn_at")
    .eq("user_id", user.id)
    .order("granted_at", { ascending: false });
  const recent = hasRecentLogin(user);
  const [aiOn, credits] = await Promise.all([
    hasAiConsent(supabase, user.id),
    creditsLeft(supabase, user.id),
  ]);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 space-y-10 px-4 py-8">
      <h1 className="text-2xl font-bold">Settings</h1>

      <section aria-labelledby="account">
        <h2 id="account" className="text-lg font-semibold">
          Account
        </h2>
        {user.is_anonymous ? (
          <p className="mt-2">
            You&apos;re using a guest session.{" "}
            <Link href="/signup" className="font-medium text-primary underline">
              Create a free account
            </Link>{" "}
            to keep your resume.
          </p>
        ) : (
          <p className="mt-2">
            Signed in as <strong>{user.email}</strong>.{" "}
            <Link href="/auth/set-password" className="text-primary underline">
              Change password
            </Link>
          </p>
        )}
      </section>

      <section aria-labelledby="ai">
        <h2 id="ai" className="text-lg font-semibold">
          AI features
        </h2>
        {user.is_anonymous ? (
          <p className="mt-2 text-muted">AI features need a free account.</p>
        ) : (
          <>
            <p className="mt-2 text-sm text-muted">
              When on, the text of your resume and any job post you paste are sent to Anthropic
              (Claude) to make suggestions. Your name, email, phone, address and photo are never
              sent. Turning this off disables the AI buttons; nothing else changes.
            </p>
            <AiConsentToggle initial={aiOn} />
            <p className="mt-2 text-sm">AI credits left this month: {credits}</p>
          </>
        )}
      </section>

      <section aria-labelledby="privacy">
        <h2 id="privacy" className="text-lg font-semibold">
          Privacy
        </h2>
        {!recent && (
          <p className="mt-2 rounded-lg bg-primary-soft p-3 text-sm">
            For your security, downloading your data or deleting your account asks you to{" "}
            <Link
              href="/login?reauth=1&next=/settings"
              className="font-medium text-primary underline"
            >
              log in again
            </Link>{" "}
            first.
          </p>
        )}

        <h3 className="mt-6 font-semibold">Download my data</h3>
        <p className="mt-1 text-sm text-muted">
          A JSON file with your account, resumes and consent history.
        </p>
        <a href="/api/export" className={`${buttonClass.secondary} mt-3`}>
          Download my data
        </a>

        <h3 className="mt-8 font-semibold">Consent history</h3>
        <ul className="mt-2 space-y-1 text-sm">
          {(consents ?? []).map((c, i) => (
            <li key={i}>
              {CONSENT_LABELS[c.consent_type] ?? c.consent_type} — version {c.version}, agreed{" "}
              {fmt.format(new Date(c.granted_at))}
              {c.withdrawn_at ? `, withdrawn ${fmt.format(new Date(c.withdrawn_at))}` : ""}
            </li>
          ))}
          {!consents?.length && <li className="text-muted">No records yet.</li>}
        </ul>

        <h3 className="mt-8 font-semibold text-danger">Delete account</h3>
        <p className="mt-1 text-sm text-muted">
          Permanently deletes your account, every resume, your photos and your consent history. This
          can&apos;t be undone. (Payment records, once payments exist, are kept only as long as tax
          rules require.)
        </p>
        <DeleteAccountForm />
      </section>
    </main>
  );
}
