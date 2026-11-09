import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonClass } from "@/components/ui";
import { loadResume } from "@/features/resume/queries";
import { disableShare, enableShare, updateShare } from "@/features/share/actions";
import { CopyLink } from "@/features/share/copy-link";
import { requireUser, siteOrigin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// Checks the login on every visit, so navigating here waits for the server (plan 6.3).
export const instant = false;

export const metadata: Metadata = { title: "Share link" };

export default async function SharePage({
  params,
  searchParams,
}: PageProps<"/resumes/[id]/share">) {
  const user = await requireUser();
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const loaded = await loadResume(supabase, user.id, id);
  if (!loaded.ok) notFound();
  const { data: share } = await supabase
    .from("resume_shares")
    .select("slug, show_contact, allow_indexing, views")
    .eq("resume_id", id)
    .maybeSingle();
  const url = share ? `${await siteOrigin()}/r/${share.slug}` : "";

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-8">
      <Link href={`/resumes/${id}/edit`} className="text-sm text-primary underline">
        ← Back to editor
      </Link>
      <h1 className="text-2xl font-bold">Share “{loaded.resume.title}”</h1>
      <p className="text-muted">
        Get a link you can paste in a message or application form. Anyone with the link can view
        your resume and download it as a PDF.
      </p>
      {query.error && (
        <p role="alert" className="text-sm text-danger">
          Something went wrong. Please try again.
        </p>
      )}
      {query.off && (
        <p role="status" className="rounded-lg bg-primary-soft p-3 text-sm">
          Link turned off. The old link no longer works.
        </p>
      )}
      {query.saved && (
        <p role="status" className="rounded-lg bg-primary-soft p-3 text-sm">
          Saved.
        </p>
      )}

      {share ? (
        <>
          <section
            aria-labelledby="link"
            className="rounded-xl border border-border/60 bg-white p-5"
          >
            <h2 id="link" className="font-semibold">
              Your link is on
            </h2>
            <CopyLink url={url} />
            <p className="mt-2 text-sm text-muted">
              Viewed {share.views} time{share.views === 1 ? "" : "s"} ·{" "}
              <a href={url} target="_blank" rel="noopener" className="underline">
                Open it
              </a>
            </p>
          </section>

          <form
            action={updateShare}
            className="space-y-4 rounded-xl border border-border/60 bg-white p-5"
          >
            <input type="hidden" name="resumeId" value={id} />
            <h2 className="font-semibold">What the link shows</h2>
            <label className="flex gap-3">
              <input
                type="checkbox"
                name="showContact"
                defaultChecked={share.show_contact}
                className="mt-1 size-5 accent-primary"
              />
              <span>
                <span className="block font-medium">Show my phone, email and address</span>
                <span className="block text-sm text-muted">
                  Off by default, so strangers who get the link can&apos;t contact you. Turn it on
                  when you send the link to an employer.
                </span>
              </span>
            </label>
            <label className="flex gap-3">
              <input
                type="checkbox"
                name="allowIndexing"
                defaultChecked={share.allow_indexing}
                className="mt-1 size-5 accent-primary"
              />
              <span>
                <span className="block font-medium">
                  Let Google and other search engines list it
                </span>
                <span className="block text-sm text-muted">
                  Off by default — the link stays out of search results.
                </span>
              </span>
            </label>
            <p className="text-sm text-muted">
              Your 2x2 photo and hidden personal details (birthdate, civil status and so on) are
              never shown on the link.
            </p>
            <button type="submit" className={buttonClass.secondary}>
              Save
            </button>
          </form>

          <form action={disableShare}>
            <input type="hidden" name="resumeId" value={id} />
            <button type="submit" className={`${buttonClass.ghost} text-danger`}>
              Turn off link
            </button>
            <p className="mt-1 text-sm text-muted">
              The link stops working right away. Turning it on again gives you a new link.
            </p>
          </form>
        </>
      ) : (
        <form action={enableShare}>
          <input type="hidden" name="resumeId" value={id} />
          <button type="submit" className={buttonClass.primary}>
            Create a link
          </button>
          <p className="mt-2 text-sm text-muted">
            Your phone, email, address and photo stay hidden until you choose to show them.
          </p>
        </form>
      )}
    </main>
  );
}
