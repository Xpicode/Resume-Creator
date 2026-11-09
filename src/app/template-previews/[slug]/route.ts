import { SAMPLE_RESUME } from "@/features/marketing/sample-resume";
import { TEMPLATE_SLUGS, type TemplateSlug } from "@/features/resume/schema";
import { renderResumePdf } from "@/pdf/render";
import { pdfToPreviewImage } from "@/pdf/render-image";

// Template gallery images (plan Phase 3C task 13): the real renderer + a sample resume.
// Rendered on demand, then cached by the CDN for a year (a redeploy clears it).
export function generateStaticParams() {
  return TEMPLATE_SLUGS.map((slug) => ({ slug }));
}

export async function GET(_request: Request, ctx: RouteContext<"/template-previews/[slug]">) {
  const { slug } = await ctx.params;
  if (!TEMPLATE_SLUGS.includes(slug as TemplateSlug)) return new Response(null, { status: 404 });
  const pdf = await renderResumePdf({
    content: SAMPLE_RESUME,
    settings: {},
    templateSlug: slug as TemplateSlug,
    paperSize: "A4",
  });
  const { image } = await pdfToPreviewImage(pdf);
  return new Response(new Uint8Array(image), {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "public, max-age=86400, s-maxage=31536000",
    },
  });
}
