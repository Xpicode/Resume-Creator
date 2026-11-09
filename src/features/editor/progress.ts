import type { Personal, ResumeContent, ResumeItem, ResumeSection } from "@/features/resume/schema";
import { SECTIONS, type SectionType } from "@/features/resume/sections";

// How far along a resume is, for the guided editor (plan 5.3: one section at a time, progress bar).

export const PERSONAL_STEP = "personal";

export const SECTION_ICONS: Record<SectionType, string> = {
  summary: "📝",
  education: "🎓",
  experience: "💼",
  internship: "🏢",
  skills: "🛠️",
  trainings_seminars: "📚",
  licenses_eligibility: "📜",
  certifications: "🏅",
  projects: "💡",
  organizations: "👥",
  awards: "🏆",
  languages: "🗣️",
  references: "🤝",
  custom: "✏️",
};

function hasText(v: unknown): boolean {
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.some(hasText);
  return typeof v === "number";
}

/** An item counts once any real field (not just its id or a checkbox) has something in it. */
export function itemFilled(item: ResumeItem): boolean {
  return Object.entries(item).some(([k, v]) => k !== "id" && typeof v !== "boolean" && hasText(v));
}

export function sectionDone(section: ResumeSection): boolean {
  if (section.type === "references" && section.availableUponRequest) return true;
  return section.items.some(itemFilled);
}

/** Enough to contact you: full name plus an email or a phone number. */
export function personalDone(p: Personal): boolean {
  return hasText(p.firstName) && hasText(p.lastName) && (hasText(p.email) || hasText(p.phone));
}

export type Step = {
  id: string;
  label: string;
  icon: string;
  done: boolean;
  hidden: boolean;
};

export function resumeProgress(content: ResumeContent): { steps: Step[]; percent: number } {
  const steps: Step[] = [
    {
      id: PERSONAL_STEP,
      label: "Personal info",
      icon: "👤",
      done: personalDone(content.personal),
      hidden: false,
    },
    ...content.sections.map((s) => ({
      id: s.id,
      label: s.title.trim() || SECTIONS[s.type].defaultTitle,
      icon: SECTION_ICONS[s.type],
      done: sectionDone(s),
      hidden: !s.isVisible,
    })),
  ];
  // Hidden sections don't count against you.
  const counted = steps.filter((s) => !s.hidden);
  const percent = Math.round((counted.filter((s) => s.done).length / counted.length) * 100);
  return { steps, percent };
}

/** The next visible step after `id`, or null at the end. */
export function nextStep(steps: Step[], id: string): Step | null {
  const i = steps.findIndex((s) => s.id === id);
  return steps.slice(i + 1).find((s) => !s.hidden) ?? null;
}
