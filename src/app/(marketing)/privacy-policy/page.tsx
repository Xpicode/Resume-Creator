import type { Metadata } from "next";
import Link from "next/link";
import { PRIVACY_POLICY_VERSION } from "@/lib/legal";
import { PRIVACY_EMAIL } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy Policy" };

// DRAFT (plan 1A task 7). Must be reviewed by a lawyer before charging money (plan 6.9).
export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
      <Link href="/" className="text-sm text-primary underline">
        ← Home
      </Link>
      <h1 className="mt-4 text-3xl font-bold">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted">Draft · Version {PRIVACY_POLICY_VERSION}</p>

      <div className="mt-8 space-y-6 [&_h2]:text-lg [&_h2]:font-semibold [&_li]:mt-1 [&_p]:mt-1 [&_p]:text-muted [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:text-muted">
        <section>
          <h2>What we collect</h2>
          <ul>
            <li>
              Account details: your email address and login method (email or Google). Guests have no
              email.
            </li>
            <li>
              Everything you type into your resume, including optional details like birthdate or
              civil status.
            </li>
            <li>
              Your profile photo, if you upload one. We remove location and camera data from it.
            </li>
            <li>A record of which version of this policy and our Terms you agreed to, and when.</li>
          </ul>
        </section>
        <section>
          <h2>Why we use it</h2>
          <p>
            To let you build, save and download your resume. We do not sell your data, show ads, or
            share your resume with employers unless you choose to send it yourself.
          </p>
        </section>
        <section>
          <h2>Sensitive information</h2>
          <p>
            Some resume details (like age, civil status, education and government license numbers)
            are sensitive personal information under the Data Privacy Act of 2012. These fields are
            optional, hidden from your PDF by default, and license numbers stay hidden unless you
            choose to show them.
          </p>
        </section>
        <section>
          <h2>Who processes it for us</h2>
          <p>
            Supabase (database, login and file storage, servers in Singapore), Vercel (hosting),
            Cloudflare (bot protection), Anthropic (AI suggestions, only if you turn AI features
            on), PayMongo (payments, only if you buy a pass), Sentry (error reports, without your
            resume text or contact details) and our email provider. Your data may be processed
            outside the Philippines by these providers, under agreements that require them to
            protect it.
          </p>
        </section>
        <section>
          <h2>AI features</h2>
          <p>
            AI features are off until you turn them on. When on, we send the text of your resume and
            any job post you paste to Anthropic to get suggestions — never your name, email, phone,
            address or photo. The AI only rewords what you wrote; nothing changes until you accept a
            suggestion. We keep a record of each AI request (feature, model and size — not the text)
            to manage costs and limits. Tailoring suggestions are deleted after 90 days, and job
            posts are deleted with their resume. You can turn AI off anytime in Settings.
          </p>
        </section>
        <section>
          <h2>Public links</h2>
          <p>
            Your resume is private unless you create a share link. Anyone with that link can see the
            resume and download it as a PDF. Your phone, email and full address are hidden on the
            link unless you choose to show them; your photo and optional personal details
            (birthdate, civil status and similar) are never shown. Links are hidden from search
            engines unless you allow it. We count how many times a link is opened, but not who
            opened it. Turning a link off makes it stop working immediately.
          </p>
        </section>
        <section>
          <h2>Payments</h2>
          <p>
            If you pay us directly for a pass, we keep the message you send us (your account email
            and payment reference) to issue your code and for our sales records. If you pay online,
            PayMongo handles the payment and emails your receipt. We keep a record of the payment
            (amount, date, status and PayMongo&apos;s reference) — never your card or wallet
            details. Because the law requires us to keep sales records, this record stays after you
            delete your account, but it is no longer linked to you.
          </p>
        </section>
        <section>
          <h2>How long we keep it</h2>
          <ul>
            <li>Guest sessions: deleted after 30 days without use.</li>
            <li>
              Accounts: until you delete them. Inactive accounts may be deleted after 24 months,
              with an email warning first.
            </li>
          </ul>
        </section>
        <section>
          <h2>Your rights</h2>
          <p>
            You can see and correct your data in the editor, download all of it as a file, and
            delete your account at any time from Settings → Privacy. Deleting is permanent. For
            anything else, contact our Data Protection Officer at{" "}
            <a href={`mailto:${PRIVACY_EMAIL}`} className="text-primary underline">
              {PRIVACY_EMAIL}
            </a>
            . You can also complain to the National Privacy Commission.
          </p>
        </section>
      </div>
    </main>
  );
}
