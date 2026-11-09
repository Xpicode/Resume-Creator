/**
 * Single source of truth for resume section types (plan 4.2).
 * The Zod schemas (schema.ts), the editor forms and the PDF view (view.ts) are all built from this.
 */

export const SECTION_TYPES = [
  "summary",
  "education",
  "experience",
  "internship",
  "skills",
  "trainings_seminars",
  "licenses_eligibility",
  "certifications",
  "projects",
  "organizations",
  "awards",
  "languages",
  "references",
  "custom",
] as const;

export type SectionType = (typeof SECTION_TYPES)[number];

export type FieldKind = "text" | "textarea" | "month" | "checkbox" | "number" | "bullets" | "url";

export type FieldDef = {
  name: string;
  label: string;
  kind: FieldKind;
  /** Max characters (text kinds) or max bullets (bullets). */
  max?: number;
  placeholder?: string;
  /** Shown under the field. */
  hint?: string;
};

export type SectionDef = {
  label: string;
  defaultTitle: string;
  maxItems: number;
  /** Render items inline ("A · B · C") instead of as blocks. */
  inline?: boolean;
  tip?: string;
  fields: FieldDef[];
};

const BULLET_MAX = 300;
const range = (currentLabel: string): FieldDef[] => [
  { name: "start", label: "Start", kind: "month" },
  { name: "end", label: "End", kind: "month" },
  { name: "isCurrent", label: currentLabel, kind: "checkbox" },
];

export const SECTIONS: Record<SectionType, SectionDef> = {
  summary: {
    label: "Summary",
    defaultTitle: "Summary",
    maxItems: 1,
    tip: "2–3 sentences: who you are, your strongest skills, and the kind of job you want.",
    fields: [
      {
        name: "text",
        label: "Summary",
        kind: "textarea",
        max: 1500,
        placeholder:
          "e.g., Information Technology graduate with OJT experience in IT support. Good with customers and quick to learn new tools.",
      },
    ],
  },
  education: {
    label: "Education",
    defaultTitle: "Education",
    maxItems: 8,
    tip: "Put your most recent school first. Add honors and your thesis if you're a fresh grad.",
    fields: [
      {
        name: "degree",
        label: "Degree / course",
        kind: "text",
        max: 150,
        placeholder: "e.g., BS Information Technology",
      },
      {
        name: "school",
        label: "School",
        kind: "text",
        max: 150,
        placeholder: "e.g., Polytechnic University of the Philippines",
      },
      ...range("I'm still studying here"),
      {
        name: "honors",
        label: "Honors",
        kind: "text",
        max: 150,
        placeholder: "e.g., Cum Laude, Dean's Lister",
      },
      { name: "thesisTitle", label: "Thesis / capstone title", kind: "text", max: 200 },
      {
        name: "relevantCoursework",
        label: "Relevant coursework",
        kind: "text",
        max: 300,
        placeholder: "e.g., Networking, Database Systems, Web Development",
      },
    ],
  },
  experience: {
    label: "Work experience",
    defaultTitle: "Work Experience",
    maxItems: 15,
    tip: "Start each bullet with an action verb and add a number when you can.",
    fields: [
      {
        name: "role",
        label: "Job title",
        kind: "text",
        max: 150,
        placeholder: "e.g., Customer Service Representative",
      },
      {
        name: "company",
        label: "Company",
        kind: "text",
        max: 150,
        placeholder: "e.g., Concentrix",
      },
      {
        name: "location",
        label: "Location",
        kind: "text",
        max: 100,
        placeholder: "e.g., Quezon City",
      },
      ...range("I currently work here"),
      {
        name: "bullets",
        label: "What you did",
        kind: "bullets",
        max: 8,
        placeholder: "e.g., Assisted 40+ customers daily at the front counter",
      },
    ],
  },
  internship: {
    label: "Internship / OJT",
    defaultTitle: "Internship (OJT)",
    maxItems: 5,
    tip: "Your OJT counts as experience. Write what you did and what you learned.",
    fields: [
      {
        name: "role",
        label: "Role",
        kind: "text",
        max: 150,
        placeholder: "e.g., IT Support Intern",
      },
      {
        name: "company",
        label: "Company / office",
        kind: "text",
        max: 150,
        placeholder: "e.g., City Hall IT Office",
      },
      { name: "location", label: "Location", kind: "text", max: 100 },
      ...range("I'm still doing my OJT here"),
      {
        name: "bullets",
        label: "What you did",
        kind: "bullets",
        max: 8,
        placeholder: "e.g., Set up and imaged 40 new desktop computers",
      },
    ],
  },
  skills: {
    label: "Skills",
    defaultTitle: "Skills",
    maxItems: 40,
    inline: true,
    tip: "List skills that match the jobs you're applying for.",
    fields: [
      { name: "name", label: "Skill", kind: "text", max: 60, placeholder: "e.g., MS Excel" },
    ],
  },
  trainings_seminars: {
    label: "Trainings & seminars",
    defaultTitle: "Trainings & Seminars",
    maxItems: 20,
    fields: [
      {
        name: "title",
        label: "Title",
        kind: "text",
        max: 200,
        placeholder: "e.g., Cybersecurity Awareness Seminar",
      },
      { name: "organizer", label: "Organizer", kind: "text", max: 150, placeholder: "e.g., DICT" },
      { name: "date", label: "Date", kind: "month" },
      { name: "hours", label: "Hours", kind: "number" },
    ],
  },
  licenses_eligibility: {
    label: "Licenses & eligibility",
    defaultTitle: "Licenses & Eligibility",
    maxItems: 10,
    fields: [
      {
        name: "name",
        label: "License / eligibility",
        kind: "text",
        max: 200,
        placeholder: "e.g., Civil Service Professional, PRC – Registered Nurse, TESDA NC II",
      },
      { name: "date", label: "Date passed", kind: "month" },
      { name: "rating", label: "Rating", kind: "text", max: 20, placeholder: "e.g., 85.50%" },
      {
        name: "validity",
        label: "Validity",
        kind: "text",
        max: 50,
        placeholder: "e.g., Valid until Jun 2027",
      },
      {
        name: "number",
        label: "License number",
        kind: "text",
        max: 50,
        hint: "Hidden unless you tick the box below.",
      },
      { name: "showNumber", label: "Show license number on my resume", kind: "checkbox" },
    ],
  },
  certifications: {
    label: "Certifications",
    defaultTitle: "Certifications",
    maxItems: 15,
    fields: [
      {
        name: "name",
        label: "Certification",
        kind: "text",
        max: 150,
        placeholder: "e.g., Google IT Support Certificate",
      },
      { name: "issuer", label: "Issued by", kind: "text", max: 150 },
      { name: "date", label: "Date", kind: "month" },
    ],
  },
  projects: {
    label: "Projects",
    defaultTitle: "Projects",
    maxItems: 10,
    fields: [
      { name: "name", label: "Project name", kind: "text", max: 150 },
      { name: "role", label: "Your role", kind: "text", max: 100 },
      { name: "start", label: "Start", kind: "month" },
      { name: "end", label: "End", kind: "month" },
      { name: "bullets", label: "What you did", kind: "bullets", max: 5 },
      { name: "link", label: "Link", kind: "url", max: 300, placeholder: "https://…" },
    ],
  },
  organizations: {
    label: "Organizations",
    defaultTitle: "Organizations",
    maxItems: 10,
    fields: [
      {
        name: "name",
        label: "Organization",
        kind: "text",
        max: 150,
        placeholder: "e.g., Junior Philippine Computer Society",
      },
      { name: "role", label: "Position", kind: "text", max: 100, placeholder: "e.g., Treasurer" },
      ...range("I'm still a member"),
      { name: "bullets", label: "What you did", kind: "bullets", max: 5 },
    ],
  },
  awards: {
    label: "Awards",
    defaultTitle: "Awards",
    maxItems: 15,
    fields: [
      {
        name: "title",
        label: "Award",
        kind: "text",
        max: 150,
        placeholder: "e.g., Best Capstone Project",
      },
      { name: "issuer", label: "Given by", kind: "text", max: 150 },
      { name: "date", label: "Date", kind: "month" },
      { name: "description", label: "Details", kind: "text", max: 300 },
    ],
  },
  languages: {
    label: "Languages",
    defaultTitle: "Languages",
    maxItems: 10,
    inline: true,
    fields: [
      { name: "name", label: "Language", kind: "text", max: 50, placeholder: "e.g., Filipino" },
      {
        name: "proficiency",
        label: "Level",
        kind: "text",
        max: 50,
        placeholder: "e.g., Native, Fluent, Conversational",
      },
    ],
  },
  references: {
    label: "Character references",
    defaultTitle: "Character References",
    maxItems: 5,
    tip: "Ask your references for permission before listing their contact details — or tick “Available upon request”.",
    fields: [
      { name: "name", label: "Name", kind: "text", max: 100 },
      { name: "position", label: "Position", kind: "text", max: 100 },
      { name: "company", label: "Company / school", kind: "text", max: 150 },
      { name: "contact", label: "Phone or email", kind: "text", max: 100 },
    ],
  },
  custom: {
    label: "Custom section",
    defaultTitle: "Other",
    maxItems: 15,
    fields: [
      { name: "title", label: "Title", kind: "text", max: 150 },
      { name: "subtitle", label: "Subtitle", kind: "text", max: 150 },
      { name: "start", label: "Start", kind: "month" },
      { name: "end", label: "End", kind: "month" },
      { name: "bullets", label: "Details", kind: "bullets", max: 8 },
    ],
  },
};

export const BULLET_MAX_CHARS = BULLET_MAX;

export type OnboardingGoal = "fresh_grad" | "experienced" | "career_shifter" | "government";

/** Sections (in order) created for a new resume, per onboarding goal (plan 5.3). */
export const DEFAULT_SECTIONS: Record<OnboardingGoal, SectionType[]> = {
  fresh_grad: [
    "summary",
    "education",
    "internship",
    "skills",
    "trainings_seminars",
    "licenses_eligibility",
    "organizations",
    "awards",
    "references",
  ],
  experienced: [
    "summary",
    "experience",
    "education",
    "skills",
    "certifications",
    "licenses_eligibility",
    "trainings_seminars",
    "references",
  ],
  career_shifter: [
    "summary",
    "skills",
    "projects",
    "experience",
    "education",
    "certifications",
    "trainings_seminars",
  ],
  government: [
    "summary",
    "education",
    "experience",
    "licenses_eligibility",
    "trainings_seminars",
    "skills",
    "references",
  ],
};
