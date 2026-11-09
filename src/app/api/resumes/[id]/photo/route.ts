import { loadPhoto } from "@/features/resume/queries";
import { NO_STORE, resumeForRequest } from "@/features/resume/route-helpers";
import { createClient } from "@/lib/supabase/server";

/** The owner's own photo for the editor thumbnail. Streamed through us so the bucket stays private. */
export async function GET(_request: Request, ctx: RouteContext<"/api/resumes/[id]/photo">) {
  const found = await resumeForRequest((await ctx.params).id);
  if (found instanceof Response) return found;
  const photo = await loadPhoto(await createClient(), found.userId, found.resume.id);
  if (!photo) return new Response(null, { status: 404, headers: NO_STORE });
  return new Response(new Uint8Array(photo), {
    headers: { ...NO_STORE, "Content-Type": "image/jpeg" },
  });
}
