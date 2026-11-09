import sharp from "sharp";
import { SAMPLE_RESUME } from "@/features/marketing/sample-resume";
import { TEMPLATE_SLUGS, type TemplateSlug } from "@/features/resume/schema";
import { renderResumePdf } from "@/pdf/render";
import { pdfToPreviewImage } from "@/pdf/render-image";

// Template gallery images (plan Phase 3C task 13): the real renderer + a sample resume.
// Rendered on demand, then cached by the CDN for a year (a redeploy clears it).
export function generateStaticParams() {
  return TEMPLATE_SLUGS.map((slug) => ({ slug }));
}

// A plain silhouette stands in for the 2x2 photo, so PH Traditional shows where it goes.
const SILHOUETTE = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 40 40">
  <rect width="40" height="40" fill="#cfe0f5"/>
  <circle cx="20" cy="16" r="7.5" fill="#7b8ba1"/>
  <path d="M5 40c1.6-9.5 8-14 15-14s13.4 4.5 15 14Z" fill="#5d6b80"/>
</svg>`;

export async function GET(_request: Request, ctx: RouteContext<"/template-previews/[slug]">) {
  const { slug } = await ctx.params;
  if (!TEMPLATE_SLUGS.includes(slug as TemplateSlug)) return new Response(null, { status: 404 });
  const withPhoto = slug === "ph-traditional";
  const pdf = await renderResumePdf({
    content: SAMPLE_RESUME,
    settings: withPhoto ? { show: { photo: true } } : {},
    templateSlug: slug as TemplateSlug,
    paperSize: "A4",
    photo: withPhoto ? await sharp(Buffer.from(SILHOUETTE)).jpeg().toBuffer() : undefined,
  });
  const { image } = await pdfToPreviewImage(pdf);
  return new Response(new Uint8Array(image), {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "public, max-age=86400, s-maxage=31536000",
    },
  });
}
