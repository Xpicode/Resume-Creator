import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import {
  PAPER_SIZES,
  resumeContentSchema,
  resumeSettingsSchema,
  TEMPLATE_SLUGS,
  type PaperSize,
  type ResumeContent,
  type ResumeSettings,
  type TemplateSlug,
} from "./schema";

export type Resume = {
  id: string;
  userId: string;
  title: string;
  templateSlug: TemplateSlug;
  paperSize: PaperSize;
  settings: ResumeSettings;
  content: ResumeContent;
  updatedAt: string;
};

export type LoadResult =
  { ok: true; resume: Resume } | { ok: false; reason: "not_found" | "unreadable" };

const rowSchema = z.object({
  id: z.uuid(),
  user_id: z.uuid(),
  title: z.string(),
  template_slug: z.enum(TEMPLATE_SLUGS),
  paper_size: z.enum(PAPER_SIZES),
  // Stored JSON is untrusted too: a user can write their own row through the API (plan 4.1).
  settings: resumeSettingsSchema,
  content: resumeContentSchema,
  updated_at: z.string(),
});

export const photoPath = (userId: string, resumeId: string) => `${userId}/${resumeId}/photo.jpg`;

/** Loads one resume as the logged-in user. RLS + the explicit user_id filter both enforce ownership. */
export async function loadResume(
  supabase: SupabaseClient,
  userId: string,
  id: string,
): Promise<LoadResult> {
  if (!z.uuid().safeParse(id).success) return { ok: false, reason: "not_found" };
  const { data } = await supabase
    .from("resumes")
    .select("id, user_id, title, template_slug, paper_size, settings, content, updated_at")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return { ok: false, reason: "not_found" };

  const parsed = rowSchema.safeParse(data);
  if (!parsed.success) return { ok: false, reason: "unreadable" };
  const r = parsed.data;
  return {
    ok: true,
    resume: {
      id: r.id,
      userId: r.user_id,
      title: r.title,
      templateSlug: r.template_slug,
      paperSize: r.paper_size,
      settings: r.settings,
      content: r.content as ResumeContent,
      updatedAt: r.updated_at,
    },
  };
}

export async function loadPhoto(
  supabase: SupabaseClient,
  userId: string,
  resumeId: string,
): Promise<Buffer | undefined> {
  const { data } = await supabase.storage.from("photos").download(photoPath(userId, resumeId));
  return data ? Buffer.from(await data.arrayBuffer()) : undefined;
}

export async function hasPhoto(
  supabase: SupabaseClient,
  userId: string,
  resumeId: string,
): Promise<boolean> {
  const { data } = await supabase.storage
    .from("photos")
    .list(`${userId}/${resumeId}`, { limit: 5 });
  return Boolean(data?.some((f) => f.name === "photo.jpg"));
}
