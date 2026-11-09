import type { ResumeContent, ResumeSettings, TemplateSlug } from "@/features/resume/schema";
import { SECTIONS } from "@/features/resume/sections";
import { resumePlainText } from "@/features/resume/text-units";

/**
 * Rule-based ATS check (plan 7.5). Free, instant, no AI.
 * ponytail: simple heuristics (word lists, unigram keywords). Upgrade path: bigger synonym list and
 * phrase matching once real job posts show what it misses.
 */

export type AtsItem = {
  id: string;
  ok: boolean;
  title: string;
  detail: string;
  /** Element id in the editor to jump to ("Fix"). */
  target?: string;
};

export type KeywordMatch = { matched: string[]; missing: string[]; percent: number };
export type AtsResult = { score: number; items: AtsItem[]; keywords?: KeywordMatch };

const STANDARD_HEADINGS = [
  "summary",
  "profile",
  "objective",
  "about",
  "education",
  "experience",
  "employment",
  "work",
  "internship",
  "ojt",
  "on-the-job",
  "skills",
  "training",
  "seminar",
  "license",
  "eligibility",
  "certification",
  "project",
  "organization",
  "affiliation",
  "award",
  "achievement",
  "honor",
  "language",
  "reference",
  "volunteer",
  "other",
];

const ACTION_VERBS = new Set(
  `accomplished achieved addressed administered analyzed answered arranged assembled assisted audited built calculated
  checked coached collaborated collected communicated compiled completed conducted configured coordinated created
  delivered designed developed diagnosed directed documented drafted earned encoded established evaluated executed
  facilitated filed fixed followed generated guided handled helped identified implemented improved increased installed
  inspected interviewed launched led maintained managed mentored monitored negotiated operated organized oversaw
  participated planned prepared presented processed produced programmed promoted provided published reconciled recorded
  recruited reduced repaired reported represented researched resolved responded reviewed scheduled served set solved
  sorted streamlined supervised supported taught tested tracked trained translated troubleshot updated upgraded verified
  volunteered won wrote`.split(/\s+/),
);

const STOPWORDS = new Set(
  `a about above after again all also am an and any are as at be because been before being below between both but by can
  could did do does doing down during each etc few for from further had has have having he her here hers him his how i if
  in into is it its just me more most must my no nor not now of off on once only or other our out over own per same she
  should so some such than that the their them then there these they this those through to too under until up very was we
  were what when where which while who whom why will with would you your yours
  ability able apply applicant applicants candidate candidates company job jobs looking position role preferred
  qualification qualifications required requirement requirements responsibilities responsibility salary benefits year
  years experience work working must-have plus least minimum knowledge good excellent strong willing hiring join team
  opportunity day days week weekly monthly time full part based including include includes within least well new
  ang ng mga sa at na para ay kung`.split(/\s+/),
);

// A few common equivalents in PH job posts. Keyword → other ways a resume might say it.
const SYNONYMS: Record<string, string[]> = {
  excel: ["spreadsheet", "spreadsheets"],
  customer: ["client", "clients", "customers"],
  communication: ["communicate", "communicated", "communicating"],
  troubleshooting: ["troubleshoot", "troubleshot", "troubleshooting"],
  bpo: ["call center", "contact center"],
  ms: ["microsoft"],
  leadership: ["led", "lead", "leader"],
};

const words = (s: string) => s.toLowerCase().match(/[a-z0-9+#]+(?:[.-][a-z0-9+#]+)*/g) ?? [];
const stem = (w: string) => w.replace(/(ing|ed|es|s)$/, "");

export function extractKeywords(jobDescription: string, limit = 20): string[] {
  const counts = new Map<string, number>();
  for (const w of words(jobDescription)) {
    if (w.length < 2 || STOPWORDS.has(w) || /^\d+$/.test(w)) continue;
    counts.set(w, (counts.get(w) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((x, y) => y[1] - x[1]) // stable: ties keep first-appearance order
    .slice(0, limit)
    .map(([w]) => w);
}

export function matchKeywords(jobDescription: string, resumeText: string): KeywordMatch {
  const keywords = extractKeywords(jobDescription);
  const haystack = new Set(words(resumeText).flatMap((w) => [w, stem(w)]));
  const lower = resumeText.toLowerCase();
  const has = (k: string) =>
    haystack.has(k) || haystack.has(stem(k)) || (SYNONYMS[k] ?? []).some((s) => lower.includes(s));
  const matched = keywords.filter(has);
  const missing = keywords.filter((k) => !has(k));
  return {
    matched,
    missing,
    percent: keywords.length ? Math.round((matched.length / keywords.length) * 100) : 0,
  };
}

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const DATED: ReadonlySet<string> = new Set([
  "education",
  "experience",
  "internship",
  "organizations",
]);

export function runAtsCheck(input: {
  content: ResumeContent;
  settings: ResumeSettings;
  templateSlug: TemplateSlug;
  pageCount?: number;
  jobDescription?: string;
}): AtsResult {
  const { content, templateSlug, pageCount } = input;
  const p = content.personal;
  const visible = content.sections.filter((s) => s.isVisible);
  const items: AtsItem[] = [];

  const missingContact = [
    !str(p.firstName) || !str(p.lastName) ? "full name" : "",
    !str(p.email) ? "email" : "",
    !str(p.phone) ? "mobile number" : "",
  ].filter(Boolean);
  items.push({
    id: "contact",
    ok: missingContact.length === 0,
    title: "Contact details",
    detail: missingContact.length
      ? `Add your ${missingContact.join(", ")}.`
      : "Name, email and mobile number are there.",
    target: "personal-info",
  });

  const odd = visible.filter((s) => {
    const title = (str(s.title) || SECTIONS[s.type].defaultTitle).toLowerCase();
    return !STANDARD_HEADINGS.some((h) => title.includes(h));
  });
  items.push({
    id: "headings",
    ok: odd.length === 0,
    title: "Standard section headings",
    detail: odd.length
      ? `ATS software may not recognise "${odd[0].title}". Use a standard heading like "${SECTIONS[odd[0].type].defaultTitle}".`
      : "Section headings are ones ATS software recognises.",
    target: odd.length ? `section-${odd[0].id}` : undefined,
  });

  const undated = visible.filter(
    (s) =>
      DATED.has(s.type) &&
      s.items.some(
        (it) =>
          Object.entries(it).some(([k, v]) => k !== "id" && str(v)) &&
          (!str(it.start) || (!str(it.end) && it.isCurrent !== true)),
      ),
  );
  items.push({
    id: "dates",
    ok: undated.length === 0,
    title: "Dates on experience and education",
    detail: undated.length
      ? `Add start and end dates in "${undated[0].title}".`
      : "Every entry has dates.",
    target: undated.length ? `section-${undated[0].id}` : undefined,
  });

  const allBullets = visible.flatMap((s) =>
    s.items.flatMap((it) =>
      Array.isArray(it.bullets)
        ? it.bullets
            .map(str)
            .filter(Boolean)
            .map((b) => ({ b, s }))
        : [],
    ),
  );
  if (allBullets.length) {
    const weak = allBullets.filter(({ b }) => {
      const first = b
        .split(/\s+/)[0]
        .toLowerCase()
        .replace(/[^a-z]/g, "");
      return !ACTION_VERBS.has(first) && !/ed$/.test(first);
    });
    items.push({
      id: "verbs",
      ok: weak.length / allBullets.length <= 0.3,
      title: "Bullets start with action verbs",
      detail: weak.length
        ? `${weak.length} of ${allBullets.length} bullets don't start with an action verb, e.g. "${weak[0].b.slice(0, 50)}". Try "Assisted…", "Handled…", "Built…".`
        : "Your bullets start with action verbs.",
      target: weak.length ? `section-${weak[0].s.id}` : undefined,
    });
    const badLength = allBullets.filter(({ b }) => b.length < 25 || b.length > 220);
    items.push({
      id: "bullet-length",
      ok: badLength.length === 0,
      title: "Bullet length",
      detail: badLength.length
        ? `${badLength.length} bullet${badLength.length > 1 ? "s are" : " is"} very short or very long. Aim for one line with a result.`
        : "Bullets are a readable length.",
      target: badLength.length ? `section-${badLength[0].s.id}` : undefined,
    });
  }

  const summary = visible.find((s) => s.type === "summary");
  items.push({
    id: "summary",
    ok: Boolean(summary?.items.some((it) => str(it.text).length >= 40)),
    title: "Summary",
    detail: summary
      ? "A 2–3 sentence summary helps recruiters and ATS see your fit quickly."
      : "Add a short summary at the top.",
    target: summary ? `section-${summary.id}` : undefined,
  });

  const skills = visible.find((s) => s.type === "skills");
  const skillCount = skills?.items.filter((it) => str(it.name)).length ?? 0;
  items.push({
    id: "skills",
    ok: skillCount >= 3,
    title: "Skills list",
    detail:
      skillCount >= 3
        ? `${skillCount} skills listed.`
        : "List at least 3 skills that match the jobs you want.",
    target: skills ? `section-${skills.id}` : undefined,
  });

  items.push({
    id: "template",
    ok: templateSlug === "ats-classic",
    title: "ATS-safe template",
    detail:
      templateSlug === "ats-classic"
        ? "ATS Classic is the safest template for online applications."
        : "PH Traditional (with photo) is for walk-in and printed applications. For JobStreet, Indeed and company portals, switch to ATS Classic.",
    target: "template",
  });

  if (pageCount !== undefined) {
    items.push({
      id: "pages",
      ok: pageCount <= 2,
      title: "Length",
      detail:
        pageCount <= 2
          ? `${pageCount} page${pageCount > 1 ? "s" : ""}. Fresh grads: aim for 1.`
          : `${pageCount} pages. Recruiters skim — keep it to 2 or fewer.`,
    });
  }

  let keywords: KeywordMatch | undefined;
  if (input.jobDescription?.trim()) {
    keywords = matchKeywords(input.jobDescription, resumePlainText(content));
    items.push({
      id: "keywords",
      ok: keywords.percent >= 60,
      title: "Keywords from the job post",
      detail: `${keywords.percent}% of the job post's main keywords appear in your resume. Add the missing ones only if you really have that skill or experience.`,
    });
  }

  const passed = items.filter((i) => i.ok).length;
  return { score: Math.round((passed / items.length) * 100), items, keywords };
}
