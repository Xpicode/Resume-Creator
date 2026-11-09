import "server-only";
import { Document, renderToBuffer } from "@react-pdf/renderer";
import type {
  PaperSize,
  ResumeContent,
  ResumeSettings,
  TemplateSlug,
} from "@/features/resume/schema";
import { buildView, fullName, type ResumeView } from "@/features/resume/view";
import { registerFonts } from "./fonts";
import { AtsClassic } from "./templates/ats-classic";
import { PhTraditional } from "./templates/ph-traditional";

export type TemplateProps = { view: ResumeView; paperSize: PaperSize; photo?: Buffer };

const TEMPLATES = { "ats-classic": AtsClassic, "ph-traditional": PhTraditional } as const;
const SUPPORTS_PHOTO: Record<TemplateSlug, boolean> = {
  "ats-classic": false,
  "ph-traditional": true,
};

export type RenderInput = {
  content: ResumeContent;
  settings: ResumeSettings;
  templateSlug: TemplateSlug;
  paperSize: PaperSize;
  photo?: Buffer;
};

/** The single renderer behind preview and download (plan 3.2: preview = download). */
export function renderResumePdf(input: RenderInput): Promise<Buffer> {
  registerFonts();
  const Template = TEMPLATES[input.templateSlug];
  const showPhoto = SUPPORTS_PHOTO[input.templateSlug] && input.settings.show?.photo === true;
  const name = fullName(input.content.personal);
  return renderToBuffer(
    <Document
      title={name ? `${name} – Resume` : "Resume"}
      author={name || undefined}
      creator=""
      producer=""
    >
      <Template
        view={buildView(input.content, input.settings)}
        paperSize={input.paperSize}
        photo={showPhoto ? input.photo : undefined}
      />
    </Document>,
  );
}
