import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { aiBlock, creditsLeft } from "@/features/ai/guard";
import { TailorWorkspace } from "@/features/ai/tailor-workspace";
import { loadResume } from "@/features/resume/queries";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Tailor to a job" };

export default async function TailorPage({ params }: PageProps<"/resumes/[id]/tailor">) {
  const user = await requireUser();
  const { id } = await params;
  const supabase = await createClient();
  const loaded = await loadResume(supabase, user.id, id);
  if (!loaded.ok) notFound();
  return (
    <TailorWorkspace
      resumeId={loaded.resume.id}
      title={loaded.resume.title}
      ai={{ block: await aiBlock(user, supabase), credits: await creditsLeft(supabase, user.id) }}
    />
  );
}
