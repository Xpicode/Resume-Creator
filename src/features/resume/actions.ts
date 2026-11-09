"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getUser, requireUser } from "@/lib/auth";
import { MAX_UPLOAD_BYTES, processProfilePhoto, sniffImageType } from "@/lib/security/image";
import { createClient } from "@/lib/supabase/server";
import { loadResume, photoPath } from "./queries";
import { newResumeContent, saveResumeSchema } from "./schema";
import type { OnboardingGoal } from "./sections";

// Server actions are public HTTP endpoints: auth → validate → authorize → act (plan 6.3).

const LIMIT_ERROR = "resume_limit_reached";
const resumeId = z.uuid();

async function createFor(goal: OnboardingGoal | null) {
  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("resumes")
    .insert({
      user_id: user.id,
      title: "My Resume",
      content: newResumeContent(goal, user.email ?? undefined),
    })
    .select("id")
    .single();
  if (error)
    redirect(error.message.includes(LIMIT_ERROR) ? "/dashboard?limit=1" : "/dashboard?error=1");
  redirect(`/resumes/${data.id}/edit`);
}

const goalSchema = z.enum(["fresh_grad", "experienced", "career_shifter", "government"]);

/** Onboarding: remember the goal, then create the first resume with the matching sections. */
export async function chooseGoal(fd: FormData): Promise<void> {
  const user = await requireUser();
  const goal = goalSchema.safeParse(fd.get("goal"));
  if (!goal.success) redirect("/onboarding");
  const supabase = await createClient();
  await supabase.from("profiles").update({ onboarding_goal: goal.data }).eq("id", user.id);

  const { count } = await supabase.from("resumes").select("id", { count: "exact", head: true });
  if (count) redirect("/dashboard");
  await createFor(goal.data);
}

export async function createResume(): Promise<void> {
  const user = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("onboarding_goal")
    .eq("id", user.id)
    .maybeSingle();
  await createFor((data?.onboarding_goal as OnboardingGoal | null) ?? null);
}

export async function duplicateResume(fd: FormData): Promise<void> {
  const user = await requireUser();
  const supabase = await createClient();
  const loaded = await loadResume(supabase, user.id, String(fd.get("id")));
  if (!loaded.ok) redirect("/dashboard");
  const r = loaded.resume;
  const { data, error } = await supabase
    .from("resumes")
    .insert({
      user_id: user.id,
      title: `${r.title} (copy)`.slice(0, 100),
      template_slug: r.templateSlug,
      paper_size: r.paperSize,
      settings: r.settings,
      content: r.content,
      parent_resume_id: r.id,
    })
    .select("id")
    .single();
  if (error)
    redirect(error.message.includes(LIMIT_ERROR) ? "/dashboard?limit=1" : "/dashboard?error=1");
  redirect(`/resumes/${data.id}/edit`);
}

export async function deleteResume(fd: FormData): Promise<void> {
  const user = await requireUser();
  const id = resumeId.safeParse(fd.get("id"));
  if (!id.success) redirect("/dashboard");
  const supabase = await createClient();
  await supabase.storage.from("photos").remove([photoPath(user.id, id.data)]);
  await supabase.from("resumes").delete().eq("id", id.data).eq("user_id", user.id);
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export type SaveResult =
  | { ok: true; updatedAt: string }
  | { ok: false; reason: "conflict" | "invalid" | "not_found" | "auth"; message?: string };

/**
 * Autosave. `expectedUpdatedAt` is the version the editor started from; if the row changed since
 * (another tab), nothing is written and the editor is told about the conflict (plan 3.2).
 */
export async function saveResume(
  id: string,
  expectedUpdatedAt: string,
  input: unknown,
): Promise<SaveResult> {
  const user = await getUser();
  if (!user) return { ok: false, reason: "auth" };
  if (!resumeId.safeParse(id).success || typeof expectedUpdatedAt !== "string")
    return { ok: false, reason: "not_found" };

  const parsed = saveResumeSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, reason: "invalid", message: issue?.message };
  }
  const v = parsed.data;

  const supabase = await createClient();
  const { data } = await supabase
    .from("resumes")
    .update({
      title: v.title,
      template_slug: v.templateSlug,
      paper_size: v.paperSize,
      settings: v.settings,
      content: v.content,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("updated_at", expectedUpdatedAt)
    .select("updated_at")
    .maybeSingle();
  if (data) return { ok: true, updatedAt: data.updated_at };

  const { data: exists } = await supabase.from("resumes").select("id").eq("id", id).maybeSingle();
  return { ok: false, reason: exists ? "conflict" : "not_found" };
}

export type PhotoResult = { ok: true } | { ok: false; message: string };

export async function uploadPhoto(id: string, fd: FormData): Promise<PhotoResult> {
  const user = await getUser();
  if (!user) return { ok: false, message: "Please log in again." };
  const supabase = await createClient();
  const loaded = await loadResume(supabase, user.id, id);
  if (!loaded.ok) return { ok: false, message: "Resume not found." };

  const file = fd.get("photo");
  if (!(file instanceof File) || file.size === 0)
    return { ok: false, message: "Choose a photo first." };
  if (file.size > MAX_UPLOAD_BYTES)
    return { ok: false, message: "That photo is over 5 MB. Try a smaller one." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!sniffImageType(bytes)) return { ok: false, message: "Use a JPG, PNG or WebP photo." };

  let jpeg: Buffer;
  try {
    jpeg = await processProfilePhoto(bytes);
  } catch {
    return { ok: false, message: "We couldn't read that photo. Try another one." };
  }
  const { error } = await supabase.storage
    .from("photos")
    .upload(photoPath(user.id, id), jpeg, { contentType: "image/jpeg", upsert: true });
  if (error) return { ok: false, message: "Upload failed. Please try again." };
  return { ok: true };
}

export async function removePhoto(id: string): Promise<PhotoResult> {
  const user = await getUser();
  if (!user || !resumeId.safeParse(id).success) return { ok: false, message: "Not allowed." };
  const supabase = await createClient();
  await supabase.storage.from("photos").remove([photoPath(user.id, id)]);
  return { ok: true };
}
