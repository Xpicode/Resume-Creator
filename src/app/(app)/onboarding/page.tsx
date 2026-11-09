import type { Metadata } from "next";
import { buttonClass } from "@/components/ui";
import { chooseGoal } from "@/features/resume/actions";
import { requireUser } from "@/lib/auth";

// Checks the login on every visit, so navigating here waits for the server (plan 6.3).
export const instant = false;

export const metadata: Metadata = { title: "What describes you?" };

const GOALS = [
  {
    value: "fresh_grad",
    label: "Fresh graduate",
    body: "Just graduated — I have OJT, school projects, orgs or seminars.",
  },
  {
    value: "experienced",
    label: "Experienced",
    body: "I've worked for a year or more and want a better resume.",
  },
  {
    value: "career_shifter",
    label: "Career shifter",
    body: "I'm moving into a new field, e.g. BPO to IT.",
  },
  {
    value: "government",
    label: "Government applicant",
    body: "I'm applying to an agency or LGU post.",
  },
];

export default async function OnboardingPage() {
  await requireUser();
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-10">
      <h1 className="text-2xl font-bold">What describes you best?</h1>
      <p className="mt-2 text-muted">
        We&apos;ll set up the right sections for you. You can change them anytime.
      </p>
      <form action={chooseGoal} className="mt-6">
        <fieldset className="space-y-3">
          <legend className="sr-only">Your situation</legend>
          {GOALS.map((g, i) => (
            <label
              key={g.value}
              className="flex cursor-pointer gap-3 rounded-xl border border-border/60 bg-white p-4 has-checked:border-primary has-checked:bg-primary-soft"
            >
              <input
                type="radio"
                name="goal"
                value={g.value}
                required
                defaultChecked={i === 0}
                className="mt-1 size-5 accent-primary"
              />
              <span>
                <span className="block font-semibold">{g.label}</span>
                <span className="block text-sm text-muted">{g.body}</span>
              </span>
            </label>
          ))}
        </fieldset>
        <button type="submit" className={`${buttonClass.primary} mt-6 w-full`}>
          Continue
        </button>
      </form>
    </main>
  );
}
