import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { buttonClass } from "@/components/ui";
import { buildView } from "@/features/resume/view";
import { countShareView, loadShared } from "@/features/share/share";
import { SITE_NAME } from "@/lib/site";

// Public, per-link and counted on each visit: always rendered on request.
export const instant = false;

export async function generateMetadata({ params }: PageProps<"/r/[slug]">): Promise<Metadata> {
  await connection();
  const shared = await loadShared((await params).slug);
  if (!shared) return { robots: { index: false, follow: false } };
  const view = buildView(shared.resume.content, shared.resume.settings);
  return {
    title: { absolute: `${view.name || "Resume"}${view.headline ? ` – ${view.headline}` : ""}` },
    description: view.headline || undefined,
    robots: { index: shared.allowIndexing, follow: false },
  };
}

export default async function SharedResumePage({ params }: PageProps<"/r/[slug]">) {
  await connection();
  const { slug } = await params;
  const shared = await loadShared(slug);
  if (!shared) notFound();
  await countShareView(slug);
  const view = buildView(shared.resume.content, shared.resume.settings);

  return (
    <div className="flex flex-1 flex-col bg-slate-100">
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:py-10">
        <div className="mb-4 flex justify-end">
          <a href={`/r/${slug}/pdf`} className={buttonClass.secondary}>
            Download PDF
          </a>
        </div>
        <article className="rounded-xl bg-white p-6 shadow-sm sm:p-10">
          <header>
            <h1 className="text-3xl font-bold text-primary">{view.name || "Resume"}</h1>
            {view.headline && <p className="mt-1 text-lg">{view.headline}</p>}
            {(view.contacts.length > 0 || view.links.length > 0) && (
              <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-muted">
                {view.contacts.map((c) => (
                  <span key={c}>{c}</span>
                ))}
                {view.links.map((l) => (
                  <a
                    key={l.url}
                    href={l.url}
                    rel="nofollow ugc noopener noreferrer"
                    className="text-primary underline"
                  >
                    {l.label || l.url}
                  </a>
                ))}
              </p>
            )}
            {view.details.length > 0 && (
              <p className="mt-1 text-sm text-muted">
                {view.details.map(([k, v]) => `${k}: ${v}`).join(" · ")}
              </p>
            )}
          </header>

          {view.sections.map((section, s) => (
            <section key={s} className="mt-8">
              <h2 className="border-b border-primary/40 pb-1 text-sm font-bold tracking-wide text-primary uppercase">
                {section.title}
              </h2>
              {section.note && <p className="mt-2">{section.note}</p>}
              {section.inline && <p className="mt-2">{section.inline}</p>}
              {section.items.map((item, i) => (
                <div key={i} className="mt-4">
                  <div className="flex flex-wrap justify-between gap-x-4">
                    <h3 className="font-semibold">{item.title}</h3>
                    {item.dates && <p className="text-sm text-muted">{item.dates}</p>}
                  </div>
                  {item.subtitle && <p className="text-muted">{item.subtitle}</p>}
                  {item.lines.map((line, l) => (
                    <p key={l}>{line}</p>
                  ))}
                  {item.bullets.length > 0 && (
                    <ul className="mt-1 list-disc space-y-0.5 pl-5">
                      {item.bullets.map((b, k) => (
                        <li key={k}>{b}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </section>
          ))}
        </article>
      </main>
      <footer className="px-4 py-6 text-center text-sm text-muted">
        Made with{" "}
        <Link href="/" className="font-medium text-primary underline">
          {SITE_NAME}
        </Link>{" "}
        — free resume builder for Filipino job seekers.
      </footer>
    </div>
  );
}
