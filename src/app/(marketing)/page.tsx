import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { buttonClass } from "@/components/ui";
import { FREE, PASS, peso } from "@/features/billing/plans";
import { WaitlistForm } from "@/features/waitlist/waitlist-form";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `${SITE_NAME} — Resume builder for Filipino job seekers` },
  alternates: { canonical: "/" },
};

const templates = [
  {
    slug: "ats-classic",
    name: "ATS Classic",
    body: "One clean column that JobStreet, Indeed and company career sites can read. Best for online applications.",
  },
  {
    slug: "ph-traditional",
    name: "PH Traditional",
    body: "The format many local employers expect, with an optional 2x2 photo. Best for walk-in and printed applications. Free.",
  },
];

const features = [
  {
    title: "Sections local employers look for",
    body: "OJT, Trainings & Seminars, Licenses & Eligibility (CSC, PRC, TESDA) and Character References — all built in, all optional.",
  },
  {
    title: "Start in seconds, no sign-up",
    body: "Build and download your first resume as a guest. Create a free account later to keep it.",
  },
  {
    title: "Works on your phone",
    body: "Made for small screens and slow data. Your work saves automatically as you type.",
  },
  {
    title: "Free ATS check",
    body: "See what to fix — missing contact details, weak bullets, missing keywords from the job post — with a button that takes you there.",
  },
  {
    title: "AI that doesn't make things up",
    body: "Paste a job post and get suggestions that reword what you already wrote. It never adds jobs, schools, numbers or licenses you don't have, and nothing changes until you accept it.",
  },
  {
    title: "Your data stays yours",
    body: "Birthdate, civil status and address are hidden unless you turn them on. Download or delete everything anytime. We don't sell your data.",
  },
];

const faqs = [
  {
    q: "Is it really free?",
    a: `Yes. The free plan gives you ${FREE.resumeLimit} resume, both templates, unlimited PDF downloads with no watermark, the ATS check and ${FREE.aiCredits} AI credits a month (with a verified account). The ${PASS.name} is only for people who want more resumes and more AI help.`,
  },
  {
    q: "Do I need an account?",
    a: "No account is needed to build and download a resume. Guest resumes are deleted after 30 days without use, so create a free account if you want to keep yours. AI features and payments need a verified account.",
  },
  {
    q: "Should I put my birthdate, civil status and religion on my resume?",
    a: "Most private employers no longer need them, and leaving them out protects your privacy. They're hidden by default; turn them on only if an employer asks.",
  },
  {
    q: "Will the AI write fake experience for me?",
    a: "No. It only rewords what you wrote and shows each change side by side. If a suggestion adds something new, we flag it so you can check it. Always make sure your resume is true.",
  },
  {
    q: `How does the ${PASS.name} work?`,
    a: `Pay ${peso(PASS.amountCentavos)} once with GCash, Maya or card for ${PASS.days} days of extra resumes and ${PASS.aiCredits} more AI credits. It doesn't renew by itself. When it ends you keep all your resumes.`,
  },
  {
    q: "Can I get a refund?",
    a: "Yes — see the Refund Policy for how. When a refund is processed, the pass ends.",
  },
  {
    q: "Can it fill out the PDS (CS Form 212) for government jobs?",
    a: "Not yet. A PDS builder is planned. For now, the PH Traditional template and the Licenses & Eligibility section help with government applications that also ask for a resume.",
  },
];

export default function Home() {
  return (
    <main className="flex-1">
      <section className="mx-auto w-full max-w-3xl px-4 py-12 text-center sm:py-20">
        <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-5xl">
          Build a resume that fits how Filipinos actually apply.
        </h1>
        <p className="mt-4 text-lg text-muted">
          Fresh grad, career shifter or experienced — get a clean, professional resume in about 15
          minutes, with the sections local employers expect.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/start" className={buttonClass.primary}>
            Create my resume — free
          </Link>
          <Link href="#templates" className={buttonClass.secondary}>
            See the templates
          </Link>
        </div>
        <p className="mt-3 text-sm text-muted">No sign-up needed to start.</p>
      </section>

      <section id="templates" aria-labelledby="templates-heading" className="bg-primary-soft/50">
        <div className="mx-auto w-full max-w-5xl px-4 py-12">
          <h2 id="templates-heading" className="text-center text-2xl font-bold">
            Two templates, both free
          </h2>
          <ul className="mt-8 grid gap-8 sm:grid-cols-2">
            {templates.map((t) => (
              <li key={t.slug}>
                <Image
                  src={`/template-previews/${t.slug}`}
                  alt={`Sample resume in the ${t.name} template`}
                  width={893}
                  height={1263}
                  unoptimized
                  className="h-auto w-full rounded-lg border border-border/60 bg-white shadow-sm"
                />
                <h3 className="mt-4 font-semibold">{t.name}</h3>
                <p className="mt-1 text-muted">{t.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="features-heading" className="mx-auto w-full max-w-5xl px-4 py-12">
        <h2 id="features-heading" className="text-center text-2xl font-bold">
          What you get
        </h2>
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <li key={f.title} className="border-l-4 border-primary pl-4">
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-1 text-muted">{f.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section id="pricing" aria-labelledby="pricing-heading" className="bg-primary-soft/50">
        <div className="mx-auto w-full max-w-4xl px-4 py-12">
          <h2 id="pricing-heading" className="text-center text-2xl font-bold">
            Simple pricing
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div className="rounded-xl border border-border/60 bg-white p-6">
              <h3 className="text-lg font-semibold">Free</h3>
              <p className="mt-1 text-3xl font-bold">₱0</p>
              <ul className="mt-4 list-disc space-y-1 pl-5 text-muted">
                <li>{FREE.resumeLimit} resume</li>
                <li>Both templates, including PH Traditional with photo</li>
                <li>Unlimited PDF downloads, no watermark</li>
                <li>ATS check</li>
                <li>{FREE.aiCredits} AI credits every month (verified account)</li>
              </ul>
              <Link href="/start" className={`${buttonClass.secondary} mt-6 w-full`}>
                Start free
              </Link>
            </div>
            <div className="rounded-xl border-2 border-primary bg-white p-6">
              <h3 className="text-lg font-semibold">{PASS.name}</h3>
              <p className="mt-1 text-3xl font-bold">
                {peso(PASS.amountCentavos)}{" "}
                <span className="text-base font-normal text-muted">/ {PASS.days} days</span>
              </p>
              <ul className="mt-4 list-disc space-y-1 pl-5 text-muted">
                <li>Everything in Free</li>
                <li>Up to {PASS.resumeLimit} resumes — one for each kind of job</li>
                <li>Tailored copies for each job post</li>
                <li>{PASS.aiCredits} extra AI credits</li>
                <li>Pay once with GCash, Maya or card. No auto-renew.</li>
              </ul>
              <Link href="/start" className={`${buttonClass.primary} mt-6 w-full`}>
                Start free, upgrade anytime
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="faq-heading" className="mx-auto w-full max-w-3xl px-4 py-12">
        <h2 id="faq-heading" className="text-center text-2xl font-bold">
          Questions
        </h2>
        <div className="mt-8 divide-y divide-border/60">
          {faqs.map((f) => (
            <details key={f.q} className="group py-4">
              <summary className="cursor-pointer font-semibold">{f.q}</summary>
              <p className="mt-2 text-muted">
                {f.a}
                {f.q === "Can I get a refund?" && (
                  <>
                    {" "}
                    <Link href="/refund-policy" className="text-primary underline">
                      Refund Policy
                    </Link>
                  </>
                )}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section aria-labelledby="updates-heading" className="mx-auto w-full max-w-2xl px-4 pb-16">
        <div className="rounded-xl bg-primary-soft p-5 sm:p-6">
          <h2 id="updates-heading" className="text-xl font-bold">
            Get news about new features
          </h2>
          <p className="mt-1 text-muted">
            Like the PDS builder for government jobs. No spam — just the big updates.
          </p>
          <WaitlistForm />
        </div>
      </section>
    </main>
  );
}
