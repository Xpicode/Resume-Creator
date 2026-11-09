import { describe, expect, it } from "vitest";
import {
  newResumeContent,
  resumeContentSchema,
  saveResumeSchema,
  type ResumeContent,
} from "@/features/resume/schema";
import { DEFAULT_SECTIONS, SECTION_TYPES } from "@/features/resume/sections";
import { buildView, formatRange, pdfFileName, safeUrl } from "@/features/resume/view";

const id = () => crypto.randomUUID();

function sample(): ResumeContent {
  return {
    version: 1,
    personal: {
      firstName: "Juan",
      lastName: "Peñaflorida",
      email: "juan@example.com",
      phone: "0917 000 0000",
      cityProvince: "Santo Niño, Marikina City",
      fullAddress: "123 Rizal St., Santo Niño, Marikina City",
      birthdate: "2003-01-15",
      civilStatus: "Single",
    },
    sections: [
      {
        id: id(),
        type: "experience",
        title: "Work Experience",
        isVisible: true,
        items: [
          {
            id: id(),
            role: "IT Support",
            company: "Acme",
            start: "2025-06",
            isCurrent: true,
            bullets: ["Fixed printers", ""],
          },
        ],
      },
      { id: id(), type: "projects", title: "", isVisible: true, items: [{ id: id() }] },
      {
        id: id(),
        type: "skills",
        title: "Skills",
        isVisible: true,
        items: [
          { id: id(), name: "Excel" },
          { id: id(), name: "Networking" },
        ],
      },
      {
        id: id(),
        type: "licenses_eligibility",
        title: "Licenses",
        isVisible: true,
        items: [
          { id: id(), name: "Civil Service Professional", number: "12345", showNumber: false },
        ],
      },
      {
        id: id(),
        type: "references",
        title: "References",
        isVisible: true,
        availableUponRequest: true,
        items: [],
      },
      {
        id: id(),
        type: "awards",
        title: "Awards",
        isVisible: false,
        items: [{ id: id(), title: "Hidden" }],
      },
    ],
  };
}

describe("resume schema", () => {
  it("accepts a valid document and every new-resume default", () => {
    expect(resumeContentSchema.safeParse(sample()).success).toBe(true);
    for (const goal of Object.keys(DEFAULT_SECTIONS) as (keyof typeof DEFAULT_SECTIONS)[]) {
      expect(resumeContentSchema.safeParse(newResumeContent(goal)).success).toBe(true);
    }
  });

  it("covers every section type in the registry", () => {
    const doc = newResumeContent(null);
    doc.sections = SECTION_TYPES.map((type) => ({
      id: id(),
      type,
      title: type,
      isVisible: true,
      items: [],
    }));
    expect(resumeContentSchema.safeParse(doc).success).toBe(true);
  });

  it("rejects unknown keys, unknown section types and over-long text", () => {
    const extraKey = sample();
    (extraKey.personal as Record<string, unknown>).isAdmin = true;
    expect(resumeContentSchema.safeParse(extraKey).success).toBe(false);

    const badType = sample();
    (badType.sections[0] as { type: string }).type = "salary";
    expect(resumeContentSchema.safeParse(badType).success).toBe(false);

    const longBullet = sample();
    longBullet.sections[0].items[0].bullets = ["x".repeat(301)];
    expect(resumeContentSchema.safeParse(longBullet).success).toBe(false);

    const itemExtraField = sample();
    itemExtraField.sections[0].items[0].salary = "100k";
    expect(resumeContentSchema.safeParse(itemExtraField).success).toBe(false);
  });

  it("rejects a malformed month and too many items", () => {
    const badMonth = sample();
    badMonth.sections[0].items[0].start = "June 2025";
    expect(resumeContentSchema.safeParse(badMonth).success).toBe(false);

    const tooMany = sample();
    tooMany.sections[2].items = Array.from({ length: 41 }, () => ({ id: id(), name: "x" }));
    expect(resumeContentSchema.safeParse(tooMany).success).toBe(false);
  });

  it("save payload requires a title and a known template", () => {
    const base = {
      title: "My resume",
      templateSlug: "ats-classic",
      paperSize: "A4",
      settings: {},
      content: sample(),
    };
    expect(saveResumeSchema.safeParse(base).success).toBe(true);
    expect(saveResumeSchema.safeParse({ ...base, title: "  " }).success).toBe(false);
    expect(saveResumeSchema.safeParse({ ...base, templateSlug: "premium-gold" }).success).toBe(
      false,
    );
  });
});

describe("resume view", () => {
  it("formats dates consistently", () => {
    expect(formatRange("2025-06", "2025-08", false)).toBe("Jun 2025 – Aug 2025");
    expect(formatRange("2025-06", "", true)).toBe("Jun 2025 – Present");
    expect(formatRange("", "", false)).toBe("");
  });

  it("hides empty and hidden sections, drops blank bullets, and inlines skills", () => {
    const view = buildView(sample(), {});
    expect(view.sections.map((s) => s.title)).toEqual([
      "Work Experience",
      "Skills",
      "Licenses",
      "References",
    ]);
    expect(view.sections[0].items[0].bullets).toEqual(["Fixed printers"]);
    expect(view.sections[0].items[0].dates).toBe("Jun 2025 – Present");
    expect(view.sections[1].inline).toBe("Excel · Networking");
    expect(view.sections[3].note).toBe("Available upon request.");
  });

  it("keeps optional PH fields and license numbers hidden by default", () => {
    const hidden = buildView(sample(), {});
    expect(hidden.details).toEqual([]);
    expect(hidden.contacts).toContain("Santo Niño, Marikina City");
    expect(JSON.stringify(hidden)).not.toContain("12345");
    expect(JSON.stringify(hidden)).not.toContain("Rizal St");

    const shown = buildView(sample(), {
      show: { birthdate: true, civilStatus: true, fullAddress: true },
    });
    expect(shown.details).toEqual([
      ["Birthdate", "15 Jan 2003"],
      ["Civil status", "Single"],
    ]);
    expect(shown.contacts).toContain("123 Rizal St., Santo Niño, Marikina City");
  });

  it("only prints http(s) links", () => {
    expect(safeUrl("https://github.com/juan")).toBe("https://github.com/juan");
    expect(safeUrl("javascript:alert(1)")).toBe("");
    expect(safeUrl("ftp://x")).toBe("");
  });

  it("builds a safe PDF file name", () => {
    expect(pdfFileName({ firstName: "Juan", lastName: "Peñaflorida" })).toBe(
      "Penaflorida_Juan_Resume.pdf",
    );
    expect(pdfFileName({ firstName: "../../etc", lastName: 'a"b' })).toBe("ab_etc_Resume.pdf");
    expect(pdfFileName({})).toBe("Resume.pdf");
  });
});
