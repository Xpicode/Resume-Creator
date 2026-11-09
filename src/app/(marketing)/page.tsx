import Link from "next/link";
import { WaitlistForm } from "@/features/waitlist/waitlist-form";
import { SITE_NAME } from "@/lib/site";

const benefits = [
  {
    title: "Made for PH hiring",
    body: "2x2 photo, Eligibility (CSC, PRC, TESDA), Trainings & Seminars, OJT and Character References — all built in, all optional.",
  },
  {
    title: "Passes ATS filters",
    body: "Clean templates that JobStreet, Indeed and company career sites can actually read.",
  },
  {
    title: "Tailor to each job — honestly",
    body: "Paste a job post and get suggestions. The AI only rewords what you wrote. It never invents experience.",
  },
];

export default function Home() {
  return (
    <>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 sm:py-20">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">{SITE_NAME}</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-balance sm:text-5xl">
          Build a resume that fits how Filipinos actually apply.
        </h1>
        <p className="mt-4 text-lg text-muted">
          Fresh grad, career shifter or experienced — get a clean, professional resume in minutes,
          with the sections local employers expect. Free to start.
        </p>

        <ul className="mt-10 space-y-6">
          {benefits.map((b) => (
            <li key={b.title} className="border-l-4 border-primary pl-4">
              <h2 className="font-semibold">{b.title}</h2>
              <p className="mt-1 text-muted">{b.body}</p>
            </li>
          ))}
        </ul>

        <section
          aria-labelledby="waitlist-heading"
          className="mt-12 rounded-xl bg-primary-soft p-5 sm:p-6"
        >
          <h2 id="waitlist-heading" className="text-xl font-bold">
            Be the first to try it
          </h2>
          <p className="mt-1 text-muted">
            Join the waitlist and we&apos;ll invite you to the beta.
          </p>
          <WaitlistForm />
        </section>
      </main>

      <footer className="mx-auto w-full max-w-2xl px-4 py-8 text-sm text-muted">
        <Link href="/privacy" className="underline">
          Privacy Notice
        </Link>
      </footer>
    </>
  );
}
