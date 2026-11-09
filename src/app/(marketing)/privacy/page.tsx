import type { Metadata } from "next";
import Link from "next/link";
import { WAITLIST_CONSENT_VERSION } from "@/features/waitlist/schema";
import { PRIVACY_EMAIL, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy Notice" };

// Waitlist-only notice for Phase 0. Replaced by the full, lawyer-reviewed Privacy Policy before launch (plan 6.9).
export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
      <Link href="/" className="text-sm text-primary underline">
        ← Back
      </Link>
      <h1 className="mt-4 text-3xl font-bold">Privacy Notice (Waitlist)</h1>
      <p className="mt-2 text-sm text-muted">
        Last updated 9 November 2026 · Version {WAITLIST_CONSENT_VERSION}
      </p>

      <div className="mt-8 space-y-6 [&_h2]:text-lg [&_h2]:font-semibold [&_p]:mt-1 [&_p]:text-muted">
        <section>
          <h2>What we collect</h2>
          <p>
            Your email address, the link you used to reach this page (for example, a Facebook
            group), the date you joined, and which version of this notice you agreed to.
          </p>
        </section>
        <section>
          <h2>Why</h2>
          <p>
            Only to tell you when {SITE_NAME} launches and to invite you to try it early. We will
            not send you other marketing or share your email with anyone for their own use.
          </p>
        </section>
        <section>
          <h2>Who processes it</h2>
          <p>
            Your email is stored with Supabase (servers in Singapore). The site is hosted on Vercel.
            Cloudflare Turnstile checks that you are not a bot, which involves your IP address and
            browser information. These providers act on our behalf and may process data outside the
            Philippines.
          </p>
        </section>
        <section>
          <h2>How long we keep it</h2>
          <p>
            Until you ask us to delete it, and at most 6 months after the app launches. After that
            we delete the waitlist.
          </p>
        </section>
        <section>
          <h2>Your rights</h2>
          <p>
            Under the Data Privacy Act of 2012 you can ask to see, correct or delete your data, or
            withdraw your consent, at any time. Email{" "}
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
