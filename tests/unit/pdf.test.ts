import { describe, expect, it } from "vitest";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import type { ResumeContent } from "@/features/resume/schema";
import { renderResumePdf } from "@/pdf/render";
import { pdfToPreviewImage } from "@/pdf/render-image";

// Plan 1D task 21: special characters, long names, 2-page overflow, empty sections hidden, selectable text.

const id = () => crypto.randomUUID();

function content(bulletCount = 2): ResumeContent {
  return {
    version: 1,
    personal: {
      firstName: "María Concepción",
      middleName: "Ñañez",
      lastName: "Peñaflorida-Dela Cruz",
      suffix: "Jr.",
      headline: "Registered Nurse",
      email: "maria@example.com",
      cityProvince: "Santo Niño, Marikina City",
    },
    sections: [
      {
        id: id(),
        type: "experience",
        title: "Work Experience",
        isVisible: true,
        items: Array.from({ length: Math.max(1, Math.ceil(bulletCount / 8)) }, (_, n) => ({
          id: id(),
          role: `Staff Nurse ${n + 1}`,
          company: "Ospital ng Maynila",
          start: "2024-01",
          isCurrent: true,
          bullets: Array.from(
            { length: Math.min(8, bulletCount) },
            (_, i) =>
              `Handled patient intake and charting for ward ${i + 1}, coordinating with doctors and families every shift.`,
          ),
        })),
      },
      {
        id: id(),
        type: "awards",
        title: "Empty Awards Section",
        isVisible: true,
        items: [{ id: id() }],
      },
      {
        id: id(),
        type: "skills",
        title: "Hidden Skills",
        isVisible: false,
        items: [{ id: id(), name: "Secret" }],
      },
    ],
  };
}

async function textOf(pdf: Buffer) {
  const doc = await getDocument({ data: new Uint8Array(pdf) }).promise;
  let text = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    text +=
      (await page.getTextContent()).items.map((it) => ("str" in it ? it.str : "")).join(" ") + "\n";
  }
  return { text, pages: doc.numPages };
}

describe.each(["ats-classic", "ph-traditional"] as const)("PDF template %s", (templateSlug) => {
  it("renders selectable text with ñ and long names, hiding empty and hidden sections", async () => {
    const pdf = await renderResumePdf({
      content: content(),
      settings: {},
      templateSlug,
      paperSize: "A4",
    });
    const { text, pages } = await textOf(pdf);
    expect(pages).toBe(1);
    expect(text).toContain("María Concepción Ñañez Peñaflorida-Dela Cruz Jr.");
    expect(text).toContain("Santo Niño, Marikina City");
    expect(text).toContain("Jan 2024 – Present");
    expect(text).not.toContain("Empty Awards Section");
    expect(text).not.toContain("Hidden Skills");
  });

  it("flows long resumes onto a second page, on Letter paper too", async () => {
    const pdf = await renderResumePdf({
      content: content(48),
      settings: {},
      templateSlug,
      paperSize: "LETTER",
    });
    const { pages, text } = await textOf(pdf);
    expect(pages).toBeGreaterThanOrEqual(2);
    expect(text).toContain("Staff Nurse 6");
  });

  it("makes a stacked preview image of every page", async () => {
    const pdf = await renderResumePdf({
      content: content(48),
      settings: {},
      templateSlug,
      paperSize: "A4",
    });
    const { image, pageCount } = await pdfToPreviewImage(pdf);
    expect(pageCount).toBeGreaterThanOrEqual(2);
    expect(image.subarray(0, 4).toString()).toBe("RIFF");
    expect(image.subarray(8, 12).toString()).toBe("WEBP");
  });
});
