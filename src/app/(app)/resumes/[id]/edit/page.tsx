import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { aiBlock, creditsLeft } from "@/features/ai/guard";
import { Editor } from "@/features/editor/editor";
import { hasPhoto, loadResume } from "@/features/resume/queries";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Edit resume" };

export default async function EditResumePage({ params }: PageProps<"/resumes/[id]/edit">) {
  const user = await requireUser();
  const { id } = await params;
  const supabase = await createClient();
  const loaded = await loadResume(supabase, user.id, id);

  if (!loaded.ok && loaded.reason === "not_found") notFound();
  if (!loaded.ok) {
    return (
      <main className="mx-auto max-w-xl flex-1 px-4 py-10">
        <h1 className="text-xl font-bold">We can&apos;t open this resume</h1>
        <p className="mt-2 text-muted">
          Some of its data isn&apos;t in a format we recognise. Your data is safe — please contact
          support.
        </p>
        <Link href="/dashboard" className="mt-4 inline-block text-primary underline">
          Back to my resumes
        </Link>
      </main>
    );
  }

  const r = loaded.resume;
  return (
    <Editor
      resumeId={r.id}
      updatedAt={r.updatedAt}
      hasPhoto={await hasPhoto(supabase, user.id, r.id)}
      isGuest={Boolean(user.is_anonymous)}
      ai={{ block: await aiBlock(user, supabase), credits: await creditsLeft(supabase, user.id) }}
      initial={{
        title: r.title,
        templateSlug: r.templateSlug,
        paperSize: r.paperSize,
        settings: r.settings,
        content: r.content,
      }}
    />
  );
}
