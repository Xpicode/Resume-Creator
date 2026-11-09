import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { buttonClass } from "@/components/ui";
import { FREE, PASS, peso } from "@/features/billing/plans";
import { AiDemo } from "@/features/marketing/ai-demo";
import { EnvelopeHero } from "@/features/marketing/envelope";
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
    use: "For online applications",
    body: "One clean column that JobStreet, Indeed and company career sites can read.",
    tilt: "-rotate-2",
  },
  {
    slug: "ph-traditional",
    name: "PH Traditional",
    use: "For walk-in and printed applications",
    body: "The format many local employers expect, with an optional 2×2 photo.",
    tilt: "rotate-2",
  },
];

const PH_SECTIONS = [
  "Internship (OJT)",
  "Trainings & Seminars",
  "CSC Eligibility",
  "PRC License",
  "TESDA NC II",
  "Character References",
  "2×2 Photo",
  "Thesis / Capstone",
  "Student Organizations",
  "Honors & Awards",
  "Languages",
];

const STEPS = [
  {
    title: "Start — no sign-up",
    body: "Tell us if you're a fresh grad, experienced, a career shifter or applying to government. We set up the right sections.",
  },
  {
    title: "Fill in, section by section",
    body: "Examples and tips on every field. Your work saves as you type, and the preview updates as you go.",
  },
  {
    title: "Download, or tailor first",
    body: "Get a PDF that's ready to send — or paste a job post and let the AI show what to improve.",
  },
];

const features = [
  {
    title: "The sections local employers look for",
    body: "OJT, Trainings & Seminars, Licenses & Eligibility (CSC, PRC, TESDA) and Character References — built in, all optional.",
  },
  {
    title: "Start now, sign up later",
    body: "Build and download your first resume as a guest. Create a free account when you want to keep it.",
  },
  {
    title: "Made for your phone",
    body: "Works on small screens and slow data. Your work saves by itself as you type.",
  },
  {
    title: "A free ATS check",
    body: "See what to fix — missing contact details, weak bullets, keywords from the job post — and jump straight to it.",
  },
  {
    title: "AI that doesn't make things up",
    body: "Paste a job post and get suggestions that reword what you wrote. It never adds jobs, schools, numbers or licenses, and nothing changes until you accept it.",
  },
  {
    title: "Your details stay yours",
    body: "Birthdate, civil status and address are hidden unless you turn them on. Download or delete everything anytime.",
  },
];

const faqs = [
  {
    q: "Is it really free?",
    a: `Yes. The free plan gives you ${FREE.resumeLimit} resume, both templates, unlimited PDF downloads with no watermark, the ATS check and ${FREE.aiCredits} AI credits a month (with a verified account). The ${PASS.name} is only for people who want more resumes and more AI help.`,
  },
  {
    q: "Do I need an account?",
    a: "No account is needed to build and download a resume. Guest resumes are deleted after 30 days without use, so create a free account if you want to keep yours. AI features and the pass need a verified account.",
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
    a: `Pay ${peso(PASS.amountCentavos)} once (for example by GCash) and enter the pass code we send you. You get ${PASS.days} days of extra resumes and ${PASS.aiCredits} more AI credits. It doesn't renew by itself. When it ends you keep all your resumes.`,
  },
  {
    q: "Can I get a refund?",
    a: "Yes — within 7 days, in full. When a refund is processed, the pass ends.",
    link: { href: "/refund-policy", label: "Refund Policy" },
  },
  {
    q: "Can it fill out the PDS (CS Form 212) for government jobs?",
    a: "Not yet — a PDS builder is on the way. For now, the PH Traditional template and the Licenses & Eligibility section help with government applications that also ask for a resume.",
  },
];

function Check() {
  return (
    <svg viewBox="0 0 24 24" className="mt-0.5 size-6 shrink-0" aria-hidden="true">
      <rect x="1.5" y="1.5" width="21" height="21" rx="5" fill="var(--primary-soft)" />
      <path
        d="M6.5 12.5l3.5 3.5 7.5-8"
        fill="none"
        stroke="var(--primary)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Home() {
  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="overflow-hidden">
        <div className="mx-auto grid w-full max-w-5xl items-center gap-10 px-4 pt-10 pb-14 sm:pt-16 md:grid-cols-[1.15fr_0.85fr] md:gap-6">
          <div className="text-center md:text-left">
            <p className="anim-fade-up text-sm font-semibold tracking-wide text-primary">
              Para sa fresh grads at job hunters
            </p>
            <h1 className="anim-fade-up anim-delay-1 mt-3 text-[2.4rem] leading-[1.05] font-extrabold text-balance sm:text-6xl">
              Build a resume that fits how Filipinos{" "}
              <span className="mark mark-animate">actually apply.</span>
            </h1>
            <p className="anim-fade-up anim-delay-2 mt-5 text-lg text-muted md:max-w-md">
              Fresh grad, career shifter or experienced — a clean, professional resume in about 15
              minutes, with the sections local employers expect.
            </p>
            <div className="anim-fade-up anim-delay-3 mt-8 flex flex-wrap justify-center gap-3 md:justify-start">
              <Link href="/start" className={buttonClass.primary}>
                Create my resume — free
              </Link>
              <Link href="#templates" className={buttonClass.secondary}>
                See the templates
              </Link>
            </div>
            <p className="anim-fade-up anim-delay-3 mt-4 text-sm text-muted">
              No sign-up to start · Works on your phone · No watermark
            </p>
          </div>
          <EnvelopeHero />
        </div>
      </section>

      {/* The PH sections, drifting by */}
      <section aria-label="Sections built in" className="border-y border-border/30 bg-white py-5">
        <div className="marquee">
          <ul className="marquee-track">
            {[...PH_SECTIONS, ...PH_SECTIONS].map((s, i) => (
              <li
                key={i}
                aria-hidden={i >= PH_SECTIONS.length ? true : undefined}
                className={`shrink-0 rounded-full border border-primary/20 bg-primary-soft px-4 py-1.5 text-sm font-semibold whitespace-nowrap text-primary ${i >= PH_SECTIONS.length ? "marquee-copy" : ""}`}
              >
                {s}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How it works — a real sequence, so it's numbered */}
      <section aria-labelledby="how-heading" className="mx-auto w-full max-w-5xl px-4 py-16">
        <h2 id="how-heading" className="reveal text-center text-3xl font-bold sm:text-4xl">
          From blank page to PDF in about 15 minutes
        </h2>
        <ol className="relative mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
          <span
            aria-hidden="true"
            className="draw-line absolute top-6 right-[16%] left-[16%] hidden h-0.5 bg-gradient-to-r from-primary/60 via-primary/30 to-primary/60 md:block"
          />
          {STEPS.map((step, i) => (
            <li key={step.title} className="reveal relative text-center">
              <span className="relative z-10 mx-auto grid size-12 place-items-center rounded-full bg-primary font-[family-name:var(--font-bricolage)] text-xl font-extrabold text-white ring-8 ring-white">
                {i + 1}
              </span>
              <h3 className="mt-4 text-xl font-bold">{step.title}</h3>
              <p className="mx-auto mt-2 max-w-xs text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Templates, laid on the desk */}
      <section
        id="templates"
        aria-labelledby="templates-heading"
        className="overflow-x-clip bg-desk"
      >
        <div className="mx-auto w-full max-w-5xl px-4 py-16">
          <div className="reveal text-center">
            <h2 id="templates-heading" className="text-3xl font-bold sm:text-4xl">
              Two templates. <span className="mark">Both free.</span>
            </h2>
            <p className="mt-3 text-muted">
              Switch anytime — your content stays, only the look changes.
            </p>
          </div>
          <ul className="mt-12 grid gap-12 sm:grid-cols-2 sm:gap-10">
            {templates.map((t) => (
              <li key={t.slug} className="reveal">
                <Image
                  src={`/template-previews/${t.slug}`}
                  alt={`Sample resume in the ${t.name} template`}
                  width={893}
                  height={1263}
                  unoptimized
                  className={`paper-tilt h-auto w-full rounded-sm bg-white shadow-[0_10px_30px_-16px_rgb(15_23_42/0.35)] ${t.tilt}`}
                />
                <p className="mt-6 text-sm font-semibold text-primary">{t.use}</p>
                <h3 className="mt-1 text-xl font-bold">{t.name}</h3>
                <p className="mt-1 text-muted">{t.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* AI — shown, not told */}
      <section aria-labelledby="ai-heading" className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-sky-200/50 via-primary/15 to-violet-200/50 blur-3xl"
        />
        <div className="relative mx-auto w-full max-w-5xl px-4 py-16">
          <div className="reveal mx-auto max-w-2xl text-center">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-sm font-semibold text-primary">
              ✨ AI help, the honest kind
            </p>
            <h2 id="ai-heading" className="mt-4 text-3xl font-bold text-balance sm:text-4xl">
              Let AI <span className="mark">polish</span> what you already wrote
            </h2>
            <p className="mt-3 text-muted">
              Stronger wording for each bullet, and a check against the job post you&apos;re
              applying to. It rewords — it never adds experience you don&apos;t have.
            </p>
          </div>
          <div className="reveal mt-10">
            <AiDemo />
          </div>
          <p className="mt-6 text-center text-sm text-muted">
            Examples. AI needs a free verified account · {FREE.aiCredits} AI credits a month on the
            free plan.
          </p>
        </div>
      </section>

      {/* What's inside — a checklist, like ticking off requirements */}
      <section aria-labelledby="features-heading" className="mx-auto w-full max-w-5xl px-4 py-16">
        <h2 id="features-heading" className="reveal text-center text-3xl font-bold sm:text-4xl">
          Everything your application needs
        </h2>
        <ul className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <li key={f.title} className="reveal flex gap-3">
              <Check />
              <div>
                <h3 className="text-lg font-bold">{f.title}</h3>
                <p className="mt-1 text-muted">{f.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Pricing */}
      <section id="pricing" aria-labelledby="pricing-heading" className="bg-desk">
        <div className="mx-auto w-full max-w-4xl px-4 py-16">
          <h2 id="pricing-heading" className="reveal text-center text-3xl font-bold sm:text-4xl">
            Simple pricing
          </h2>
          <p className="reveal mt-3 text-center text-muted">
            Free covers your first resume. Pay only if you want more.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <div className="reveal flex flex-col rounded-2xl border border-border/50 bg-white p-6">
              <h3 className="text-lg font-bold">Free</h3>
              <p className="mt-2 font-[family-name:var(--font-bricolage)] text-4xl font-extrabold">
                ₱0
              </p>
              <ul className="mt-5 flex-1 space-y-2 text-muted">
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
            <div className="reveal relative flex flex-col rounded-2xl border-2 border-primary bg-white p-6 shadow-[0_18px_40px_-24px_rgb(30_58_138/0.5)]">
              <span className="absolute -top-3 right-5 rounded-full bg-highlight px-3 py-0.5 text-xs font-bold text-foreground">
                One-time · no auto-renew
              </span>
              <h3 className="text-lg font-bold">{PASS.name}</h3>
              <p className="mt-2 font-[family-name:var(--font-bricolage)] text-4xl font-extrabold">
                {peso(PASS.amountCentavos)}{" "}
                <span className="font-[family-name:var(--font-inter)] text-base font-normal text-muted">
                  / {PASS.days} days
                </span>
              </p>
              <ul className="mt-5 flex-1 space-y-2 text-muted">
                <li>Everything in Free</li>
                <li>Up to {PASS.resumeLimit} resumes — one for each kind of job</li>
                <li>Tailored copies for each job post</li>
                <li>{PASS.aiCredits} extra AI credits</li>
              </ul>
              <Link href="/start" className={`${buttonClass.primary} mt-6 w-full`}>
                Start free, upgrade anytime
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq-heading" className="mx-auto w-full max-w-3xl px-4 py-16">
        <h2 id="faq-heading" className="reveal text-center text-3xl font-bold sm:text-4xl">
          Questions
        </h2>
        <div className="mt-8 divide-y divide-border/40 border-y border-border/40">
          {faqs.map((f) => (
            <details key={f.q} className="faq group">
              <summary className="flex cursor-pointer items-start justify-between gap-4 py-5 font-semibold">
                {f.q}
                <span
                  aria-hidden="true"
                  className="faq-icon grid size-7 shrink-0 place-items-center rounded-full bg-primary-soft text-lg leading-none text-primary"
                >
                  +
                </span>
              </summary>
              <p className="-mt-1 pr-11 pb-5 text-muted">
                {f.a}
                {f.link && (
                  <>
                    {" "}
                    <Link href={f.link.href} className="text-primary underline">
                      {f.link.label}
                    </Link>
                  </>
                )}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* Closing call to action + updates */}
      <section className="mx-auto w-full max-w-5xl px-4 pb-16">
        <div className="reveal rounded-3xl bg-primary px-6 py-12 text-center text-white sm:px-12">
          <h2 className="text-3xl font-bold text-balance sm:text-4xl">
            Your next application starts here.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-white/80">
            About 15 minutes to a resume you can send today. Free, no sign-up to start.
          </p>
          <Link
            href="/start"
            className="mt-8 inline-flex items-center justify-center rounded-lg bg-highlight px-6 py-3 font-bold text-foreground transition-transform duration-150 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-[0.98] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
          >
            Create my resume — free
          </Link>
        </div>

        <div className="reveal mx-auto mt-12 max-w-2xl rounded-2xl border border-border/40 p-5 sm:p-6">
          <h2 className="text-xl font-bold">Get news about new features</h2>
          <p className="mt-1 text-muted">
            Like the PDS builder for government jobs. No spam — just the big updates.
          </p>
          <WaitlistForm />
        </div>
      </section>
    </main>
  );
}
