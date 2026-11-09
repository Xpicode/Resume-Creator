import { NO_STORE, renderForResume, resumeForRequest } from "@/features/resume/route-helpers";
import { pdfFileName } from "@/features/resume/view";

/** Download (plan 3.2): auth + ownership, rendered on the server, never cached. */
export async function GET(_request: Request, ctx: RouteContext<"/api/resumes/[id]/pdf">) {
  const found = await resumeForRequest((await ctx.params).id);
  if (found instanceof Response) return found;

  const pdf = await renderForResume(found.resume, found.userId);
  return new Response(new Uint8Array(pdf), {
    headers: {
      ...NO_STORE,
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${pdfFileName(found.resume.content.personal)}"`,
    },
  });
}
