import type { Metadata } from "next";
import Link from "next/link";
import { TERMS_VERSION } from "@/lib/legal";
import { PRIVACY_EMAIL } from "@/lib/site";

export const metadata: Metadata = { title: "Terms" };

// DRAFT (plan 1A task 7). Must be reviewed by a lawyer before charging money (plan 6.9).
export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
      <Link href="/" className="text-sm text-primary underline">
        ← Home
      </Link>
      <h1 className="mt-4 text-3xl font-bold">Terms of Use</h1>
      <p className="mt-2 text-sm text-muted">Draft · Version {TERMS_VERSION}</p>

      <div className="mt-8 space-y-6 [&_h2]:text-lg [&_h2]:font-semibold [&_p]:mt-1 [&_p]:text-muted">
        <section>
          <h2>Your resume is yours</h2>
          <p>
            You own what you write. We only store and process it to provide the service, as
            described in our Privacy Policy.
          </p>
        </section>
        <section>
          <h2>Be truthful</h2>
          <p>
            You are responsible for making sure your resume is accurate. Don&apos;t list experience,
            schools, licenses or references you don&apos;t have.
          </p>
        </section>
        <section>
          <h2>Fair use</h2>
          <p>
            Don&apos;t use the service to harm others, upload other people&apos;s data without their
            permission, or try to break, overload or get around its security.
          </p>
        </section>
        <section>
          <h2>Free plan and guests</h2>
          <p>
            The free plan includes one resume. Guest sessions are deleted after 30 days without use
            — create a free account to keep your work.
          </p>
        </section>
        <section>
          <h2>Job Hunt Pass</h2>
          <p>
            The Job Hunt Pass is a one-time payment for 30 days of extra features. It does not renew
            by itself. You pay us directly (for example by GCash) and receive a one-time pass code,
            or pay online through PayMongo when available. We never ask for your card details or
            wallet PIN. A pass code works once and only for the account that redeems it. Refunds
            follow our{" "}
            <Link href="/refund-policy" className="text-primary underline">
              Refund Policy
            </Link>
            . When a pass ends or is refunded, you keep your resumes but lose the extra features.
          </p>
        </section>
        <section>
          <h2>No guarantee of a job</h2>
          <p>
            We help you make a better resume, but we can&apos;t promise interviews or offers. The
            service is provided as is.
          </p>
        </section>
        <section>
          <h2>Contact</h2>
          <p>
            Questions:{" "}
            <a href={`mailto:${PRIVACY_EMAIL}`} className="text-primary underline">
              {PRIVACY_EMAIL}
            </a>
          </p>
        </section>
      </div>
    </main>
  );
}
