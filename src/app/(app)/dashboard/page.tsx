import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonClass } from "@/components/ui";
import { createResume, deleteResume, duplicateResume } from "@/features/resume/actions";
import { creditsLeft } from "@/features/ai/guard";
import { PASS, peso } from "@/features/billing/plans";
import { activePass, dateFmt } from "@/features/billing/status";
import { ConfirmButton } from "@/features/resume/confirm-button";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// Checks the login on every visit, so navigating here waits for the server (plan 6.3).
export const instant = false;

export const metadata: Metadata = { title: "My resumes" };

const TEMPLATE_NAMES: Record<string, string> = {
  "ats-classic": "ATS Classic",
  "ph-traditional": "PH Traditional",
};
const fmt = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Manila",
});

export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const user = await requireUser();
  const params = await searchParams;
  const supabase = await createClient();
  const [{ data: resumes }, { data: profile }] = await Promise.all([
    supabase
      .from("resumes")
      .select("id, title, template_slug, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false }),
    supabase.from("profiles").select("onboarding_goal").eq("id", user.id).maybeSingle(),
  ]);
  if (!profile?.onboarding_goal && !resumes?.length) redirect("/onboarding");
  const [pass, credits] = user.is_anonymous
    ? [null, 0]
    : await Promise.all([activePass(supabase, user.id), creditsLeft(supabase, user.id)]);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">My resumes</h1>
        {!user.is_anonymous && (
          <Link href="/billing" className="rounded-full bg-primary-soft px-3 py-1 text-sm">
            {pass ? `${PASS.name} until ${dateFmt.format(new Date(pass.endsAt))}` : "Free plan"} ·{" "}
            {credits} AI credits left
          </Link>
        )}
      </div>
      {params.limit && (
        <p role="alert" className="mt-4 rounded-lg bg-primary-soft p-3 text-sm">
          The free plan includes 1 resume.{" "}
          <Link href="/billing" className="font-medium text-primary underline">
            Get the {PASS.name}
          </Link>{" "}
          ({peso(PASS.amountCentavos)} for {PASS.days} days) for more resumes and tailored copies.
        </p>
      )}
      {params.error && (
        <p role="alert" className="mt-4 text-sm text-danger">
          Something went wrong. Please try again.
        </p>
      )}

      {resumes?.length ? (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {resumes.map((r) => (
            <li key={r.id} className="rounded-xl border border-border/60 bg-white p-4">
              <h2 className="font-semibold">
                <Link href={`/resumes/${r.id}/edit`} className="hover:underline">
                  {r.title}
                </Link>
              </h2>
              <p className="mt-1 text-sm text-muted">
                {TEMPLATE_NAMES[r.template_slug] ?? r.template_slug} · Edited{" "}
                {fmt.format(new Date(r.updated_at))}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`/resumes/${r.id}/edit`} className={buttonClass.secondary}>
                  Edit
                </Link>
                <a href={`/api/resumes/${r.id}/pdf`} className={buttonClass.secondary}>
                  Download PDF
                </a>
                <Link href={`/resumes/${r.id}/tailor`} className={buttonClass.ghost}>
                  ✨ Tailor
                </Link>
                <Link href={`/resumes/${r.id}/share`} className={buttonClass.ghost}>
                  Share
                </Link>
                <form action={duplicateResume}>
                  <input type="hidden" name="id" value={r.id} />
                  <button type="submit" className={buttonClass.ghost}>
                    Duplicate
                  </button>
                </form>
                <form action={deleteResume}>
                  <input type="hidden" name="id" value={r.id} />
                  <ConfirmButton
                    message={`Delete "${r.title}"? This can't be undone.`}
                    className={`${buttonClass.ghost} text-danger`}
                  >
                    Delete
                  </ConfirmButton>
                </form>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-10 rounded-xl border border-dashed border-border p-8 text-center">
          <p className="text-lg font-semibold">Start with your first resume</p>
          <p className="mt-1 text-muted">
            It takes about 15 minutes. We&apos;ll guide you section by section.
          </p>
          <form action={createResume} className="mt-4">
            <button type="submit" className={buttonClass.primary}>
              Create my resume
            </button>
          </form>
        </div>
      )}
      {resumes?.length ? (
        <form action={createResume} className="mt-6">
          <button type="submit" className={buttonClass.secondary}>
            + New resume
          </button>
        </form>
      ) : null}
    </main>
  );
}
