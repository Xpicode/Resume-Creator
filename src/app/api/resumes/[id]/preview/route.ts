import { NO_STORE, renderForResume, resumeForRequest } from "@/features/resume/route-helpers";
import { takeRateLimit, tooManyRequests } from "@/lib/security/rate-limit";
import { pdfToPreviewImage } from "@/pdf/render-image";

/** Live preview: the same PDF as the download, shown as one image of all pages (Phase 0 decision). */
export async function GET(_request: Request, ctx: RouteContext<"/api/resumes/[id]/preview">) {
  const found = await resumeForRequest((await ctx.params).id);
  if (found instanceof Response) return found;
  if (!(await takeRateLimit(found.userId, "preview"))) return tooManyRequests("preview");

  const pdf = await renderForResume(found.resume, found.userId);
  const { image, pageCount } = await pdfToPreviewImage(pdf);
  return new Response(new Uint8Array(image), {
    headers: { ...NO_STORE, "Content-Type": "image/webp", "X-Page-Count": String(pageCount) },
  });
}
