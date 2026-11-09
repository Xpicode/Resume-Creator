import { pdfFileName } from "@/features/resume/view";
import { loadShared } from "@/features/share/share";
import { takeRateLimit, tooManyRequests } from "@/lib/security/rate-limit";
import { renderResumePdf } from "@/pdf/render";

/** PDF from a public link: same renderer as the owner's download, with the public hiding rules. */
export async function GET(_request: Request, ctx: RouteContext<"/r/[slug]/pdf">) {
  const shared = await loadShared((await ctx.params).slug);
  if (!shared) return new Response(null, { status: 404 });
  if (!(await takeRateLimit(shared.ownerId, "share_pdf"))) return tooManyRequests("share_pdf");

  const { resume } = shared;
  const pdf = await renderResumePdf({
    content: resume.content,
    settings: resume.settings,
    templateSlug: resume.templateSlug,
    paperSize: resume.paperSize,
  });
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${pdfFileName(resume.content.personal)}"`,
      "Cache-Control": "private, no-store",
      ...(shared.allowIndexing ? {} : { "X-Robots-Tag": "noindex" }),
    },
  });
}
