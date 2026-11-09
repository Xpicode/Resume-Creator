import type { Personal, ResumeContent, ResumeItem, ResumeSection, ResumeSettings } from "./schema";
import { SECTIONS } from "./sections";

/** What a PDF template prints. Built once so every template formats data the same way. */
export type ResumeView = {
  name: string;
  headline: string;
  contacts: string[];
  links: { label: string; url: string }[];
  /** Optional PH fields the user switched on, e.g. ["Birthdate", "15 Jan 2003"]. */
  details: [string, string][];
  sections: ViewSection[];
};

export type ViewSection = { title: string; inline?: string; note?: string; items: ViewItem[] };
export type ViewItem = {
  title: string;
  subtitle: string;
  dates: string;
  lines: string[];
  bullets: string[];
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2025-06" → "Jun 2025" */
export function formatMonth(value: unknown): string {
  if (typeof value !== "string") return "";
  const m = /^(\d{4})-(\d{2})$/.exec(value);
  return m ? `${MONTHS[Number(m[2]) - 1]} ${m[1]}` : "";
}

/** One consistent format for every date range (plan 5.5): "Jun 2025 – Aug 2025", "Jun 2025 – Present". */
export function formatRange(start: unknown, end: unknown, isCurrent: unknown): string {
  const s = formatMonth(start);
  const e = isCurrent === true ? "Present" : formatMonth(end);
  if (s && e) return `${s} – ${e}`;
  return s || e;
}

/** "2003-01-15" → "15 Jan 2003" */
export function formatDate(value: unknown): string {
  if (typeof value !== "string") return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return m ? `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}` : "";
}

const s = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const bullets = (v: unknown) => (Array.isArray(v) ? v.map(s).filter(Boolean) : []);
const joined = (...parts: string[]) => parts.filter(Boolean).join(" · ");

/** Only http(s) links are ever printed as links (blocks javascript: and similar). */
export function safeUrl(value: unknown): string {
  const url = s(value);
  return /^https?:\/\/[^\s]+$/i.test(url) ? url : "";
}

export function fullName(p: Personal): string {
  return [s(p.firstName), s(p.middleName), s(p.lastName), s(p.suffix)].filter(Boolean).join(" ");
}

function itemView(section: ResumeSection, it: ResumeItem): ViewItem {
  const range = formatRange(it.start, it.end, it.isCurrent);
  const date = formatMonth(it.date);
  switch (section.type) {
    case "summary":
      return {
        title: "",
        subtitle: "",
        dates: "",
        lines: [s(it.text)].filter(Boolean),
        bullets: [],
      };
    case "education":
      return {
        title: s(it.degree),
        subtitle: s(it.school),
        dates: range,
        lines: [
          s(it.honors),
          s(it.thesisTitle) && `Thesis: ${s(it.thesisTitle)}`,
          s(it.relevantCoursework) && `Relevant coursework: ${s(it.relevantCoursework)}`,
        ].filter(Boolean),
        bullets: [],
      };
    case "experience":
    case "internship":
      return {
        title: s(it.role),
        subtitle: joined(s(it.company), s(it.location)),
        dates: range,
        lines: [],
        bullets: bullets(it.bullets),
      };
    case "trainings_seminars":
      return {
        title: s(it.title),
        subtitle: s(it.organizer),
        dates: date,
        lines: typeof it.hours === "number" && it.hours > 0 ? [`${it.hours} hours`] : [],
        bullets: [],
      };
    case "licenses_eligibility":
      return {
        title: s(it.name),
        subtitle: "",
        dates: date,
        lines: [
          s(it.rating) && `Rating: ${s(it.rating)}`,
          s(it.validity),
          it.showNumber === true && s(it.number) ? `License No. ${s(it.number)}` : "",
        ].filter(Boolean),
        bullets: [],
      };
    case "certifications":
      return { title: s(it.name), subtitle: s(it.issuer), dates: date, lines: [], bullets: [] };
    case "projects":
      return {
        title: s(it.name),
        subtitle: s(it.role),
        dates: formatRange(it.start, it.end, false),
        lines: [safeUrl(it.link)].filter(Boolean),
        bullets: bullets(it.bullets),
      };
    case "organizations":
      return {
        title: s(it.role),
        subtitle: s(it.name),
        dates: range,
        lines: [],
        bullets: bullets(it.bullets),
      };
    case "awards":
      return {
        title: s(it.title),
        subtitle: s(it.issuer),
        dates: date,
        lines: [s(it.description)].filter(Boolean),
        bullets: [],
      };
    case "references":
      return {
        title: s(it.name),
        subtitle: joined(s(it.position), s(it.company)),
        dates: "",
        lines: [s(it.contact)].filter(Boolean),
        bullets: [],
      };
    case "skills":
      return { title: s(it.name), subtitle: "", dates: "", lines: [], bullets: [] };
    case "languages":
      return {
        title: s(it.proficiency) ? `${s(it.name)} (${s(it.proficiency)})` : s(it.name),
        subtitle: "",
        dates: "",
        lines: [],
        bullets: [],
      };
    case "custom":
      return {
        title: s(it.title),
        subtitle: s(it.subtitle),
        dates: formatRange(it.start, it.end, false),
        lines: [],
        bullets: bullets(it.bullets),
      };
  }
}

const isEmpty = (v: ViewItem) =>
  !v.title && !v.subtitle && !v.dates && !v.lines.length && !v.bullets.length;

export function buildView(content: ResumeContent, settings: ResumeSettings): ResumeView {
  const p = content.personal;
  const show = settings.show ?? {};

  const details: [string, string][] = [];
  if (show.birthdate && formatDate(p.birthdate))
    details.push(["Birthdate", formatDate(p.birthdate)]);
  if (show.civilStatus && s(p.civilStatus)) details.push(["Civil status", s(p.civilStatus)]);
  if (show.sex && s(p.sex)) details.push(["Sex", s(p.sex)]);
  if (show.nationality && s(p.nationality)) details.push(["Nationality", s(p.nationality)]);

  const sections: ViewSection[] = [];
  for (const section of content.sections) {
    if (!section.isVisible) continue;
    const def = SECTIONS[section.type];
    const title = s(section.title) || def.defaultTitle;

    if (section.type === "references" && section.availableUponRequest) {
      sections.push({ title, note: "Available upon request.", items: [] });
      continue;
    }

    const items = section.items.map((it) => itemView(section, it)).filter((v) => !isEmpty(v));
    if (!items.length) continue; // empty sections are hidden (plan 1D task 21)

    sections.push(
      def.inline
        ? { title, inline: items.map((i) => i.title).join(" · "), items: [] }
        : { title, items },
    );
  }

  return {
    name: fullName(p),
    headline: s(p.headline),
    contacts: [
      s(p.email),
      s(p.phone),
      show.fullAddress && s(p.fullAddress) ? s(p.fullAddress) : s(p.cityProvince),
    ].filter(Boolean),
    links: (p.links ?? [])
      .map((l) => ({ label: s(l.label), url: safeUrl(l.url) }))
      .filter((l) => l.url),
    details,
    sections,
  };
}

/** "Lastname_Firstname_Resume.pdf" (plan 3.2); only safe filename characters. */
export function pdfFileName(p: Personal): string {
  const clean = (v: unknown) =>
    s(v)
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^A-Za-z0-9-]+/g, "")
      .slice(0, 40);
  const parts = [clean(p.lastName), clean(p.firstName)].filter(Boolean);
  return `${parts.length ? parts.join("_") + "_" : ""}Resume.pdf`;
}
