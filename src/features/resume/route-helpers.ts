import "server-only";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { renderResumePdf } from "@/pdf/render";
import { loadPhoto, loadResume, type Resume } from "./queries";

export const NO_STORE = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex" };

const status = (code: number) => new Response(null, { status: code, headers: NO_STORE });

/** Auth + ownership for the resume routes. Returns a Response to send on failure. */
export async function resumeForRequest(
  id: string,
): Promise<{ resume: Resume; userId: string } | Response> {
  const user = await getUser();
  if (!user) return status(401);
  const loaded = await loadResume(await createClient(), user.id, id);
  if (!loaded.ok) return status(loaded.reason === "not_found" ? 404 : 422);
  return { resume: loaded.resume, userId: user.id };
}

export async function renderForResume(resume: Resume, userId: string): Promise<Buffer> {
  const wantsPhoto =
    resume.templateSlug === "ph-traditional" && resume.settings.show?.photo === true;
  const photo = wantsPhoto ? await loadPhoto(await createClient(), userId, resume.id) : undefined;
  return renderResumePdf({
    content: resume.content,
    settings: resume.settings,
    templateSlug: resume.templateSlug,
    paperSize: resume.paperSize,
    photo,
  });
}
