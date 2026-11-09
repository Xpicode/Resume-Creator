import { z } from "zod";
import {
  BULLET_MAX_CHARS,
  DEFAULT_SECTIONS,
  SECTION_TYPES,
  SECTIONS,
  type FieldDef,
  type OnboardingGoal,
  type SectionType,
} from "./sections";

// Lenient while typing: everything is optional so autosave never blocks on a half-filled form.
// Strict on shape and size: unknown keys and over-long values are rejected (plan 6.4).

const month = z.string().regex(/^(\d{4}-(0[1-9]|1[0-2]))?$/, "Use the month picker");

function fieldSchema(f: FieldDef): z.ZodType {
  switch (f.kind) {
    case "checkbox":
      return z.boolean().optional();
    case "number":
      return z.number().int().min(0).max(10000).optional();
    case "month":
      return month.optional();
    case "bullets":
      return z
        .array(z.string().max(BULLET_MAX_CHARS))
        .max(f.max ?? 8)
        .optional();
    default:
      return z
        .string()
        .max(f.max ?? 200)
        .optional();
  }
}

export type ItemValue = string | number | boolean | string[] | undefined;
export type ResumeItem = { id: string; [field: string]: ItemValue };

export type ResumeSection = {
  id: string;
  type: SectionType;
  title: string;
  isVisible: boolean;
  items: ResumeItem[];
  /** References only: print "Available upon request" instead of the list. */
  availableUponRequest?: boolean;
};

const sectionSchemas = SECTION_TYPES.map((type) => {
  const def = SECTIONS[type];
  const item = z.strictObject({
    id: z.uuid(),
    ...Object.fromEntries(def.fields.map((f) => [f.name, fieldSchema(f)])),
  });
  return z.strictObject({
    id: z.uuid(),
    type: z.literal(type),
    title: z.string().max(60),
    isVisible: z.boolean(),
    items: z.array(item).max(def.maxItems),
    availableUponRequest: z.boolean().optional(),
  });
});

const sectionSchema = z.discriminatedUnion(
  "type",
  sectionSchemas as unknown as [
    (typeof sectionSchemas)[number],
    ...(typeof sectionSchemas)[number][],
  ],
) as unknown as z.ZodType<ResumeSection>;

const str = (max: number) => z.string().max(max).optional();

export const CIVIL_STATUSES = [
  "",
  "Single",
  "Married",
  "Widowed",
  "Separated",
  "Solo Parent",
] as const;
export const SEXES = ["", "Female", "Male"] as const;

export const personalSchema = z.strictObject({
  firstName: str(60),
  middleName: str(60),
  lastName: str(60),
  suffix: str(10),
  headline: str(100),
  email: str(254),
  phone: str(30),
  cityProvince: str(100),
  // Optional PH fields — hidden on the resume unless switched on in settings.show (plan 4.2 / 6.8).
  fullAddress: str(200),
  birthdate: z
    .string()
    .regex(/^(\d{4}-\d{2}-\d{2})?$/)
    .optional(),
  civilStatus: z.enum(CIVIL_STATUSES).optional(),
  nationality: str(50),
  sex: z.enum(SEXES).optional(),
  links: z
    .array(z.strictObject({ id: z.uuid(), label: str(30), url: str(300) }))
    .max(5)
    .optional(),
});

export type Personal = z.infer<typeof personalSchema>;

export const resumeContentSchema = z.strictObject({
  version: z.literal(1),
  personal: personalSchema,
  sections: z.array(sectionSchema).max(25),
});

export type ResumeContent = { version: 1; personal: Personal; sections: ResumeSection[] };

export const OPTIONAL_FIELDS = [
  "photo",
  "fullAddress",
  "birthdate",
  "civilStatus",
  "nationality",
  "sex",
] as const;
export type OptionalField = (typeof OPTIONAL_FIELDS)[number];

export const resumeSettingsSchema = z.strictObject({
  show: z.partialRecord(z.enum(OPTIONAL_FIELDS), z.boolean()).optional(),
});

export type ResumeSettings = z.infer<typeof resumeSettingsSchema>;

export const TEMPLATE_SLUGS = ["ats-classic", "ph-traditional"] as const;
export type TemplateSlug = (typeof TEMPLATE_SLUGS)[number];
export const PAPER_SIZES = ["A4", "LETTER"] as const;
export type PaperSize = (typeof PAPER_SIZES)[number];

/** Everything the editor saves in one autosave call. */
export const saveResumeSchema = z.strictObject({
  title: z.string().trim().min(1, "Give your resume a name").max(100),
  templateSlug: z.enum(TEMPLATE_SLUGS),
  paperSize: z.enum(PAPER_SIZES),
  settings: resumeSettingsSchema,
  content: resumeContentSchema,
});

export type SaveResumeInput = z.infer<typeof saveResumeSchema>;

export function emptyItem(): ResumeItem {
  return { id: crypto.randomUUID() };
}

export function newSection(type: SectionType): ResumeSection {
  return {
    id: crypto.randomUUID(),
    type,
    title: SECTIONS[type].defaultTitle,
    isVisible: true,
    items: [emptyItem()],
  };
}

export function newResumeContent(goal: OnboardingGoal | null, email?: string): ResumeContent {
  return {
    version: 1,
    personal: { email: email ?? "" },
    sections: DEFAULT_SECTIONS[goal ?? "fresh_grad"].map(newSection),
  };
}
