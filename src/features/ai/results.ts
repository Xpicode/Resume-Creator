import { z } from "zod";
import type { TextUnit } from "@/features/resume/text-units";
import { findNewFacts } from "./honesty";

// What we ask the model for (kept simple for structured outputs), then clean and check on our side.
export const optionsOutput = z.object({ options: z.array(z.string()) });
export const tailorOutput = z.object({
  matched_keywords: z.array(z.string()),
  missing_keywords: z.array(z.string()),
  gaps: z.array(z.string()),
  suggestions: z.array(z.object({ ref: z.string(), proposed: z.string(), reason: z.string() })),
});

export type Option = { text: string; flags: string[] };

export type TailorSuggestion = {
  ref: string;
  label: string;
  original: string;
  proposed: string;
  reason: string;
  /** New numbers/names not found in the user's resume (plan 7.2). */
  flags: string[];
  status: "pending" | "applied" | "dismissed";
};

export type TailorAnalysis = {
  matchedKeywords: string[];
  missingKeywords: string[];
  gaps: string[];
  suggestions: TailorSuggestion[];
};

const clip = (list: string[], max: number, len: number) =>
  [...new Set(list.map((s) => s.trim()).filter((s) => s && s.length <= len))].slice(0, max);

/** Options for one bullet or the summary: trimmed, deduped, size-checked, honesty-flagged. */
export function cleanOptions(
  options: string[],
  original: string,
  source: string,
  maxLen: number,
  max = 3,
): Option[] {
  const seen = new Set([original.trim().toLowerCase()]);
  const out: Option[] = [];
  for (const raw of options) {
    const text = raw.trim().replace(/^[•\-*]\s*/, "");
    if (!text || text.length > maxLen || seen.has(text.toLowerCase())) continue;
    seen.add(text.toLowerCase());
    out.push({ text, flags: findNewFacts(text, source) });
    if (out.length === max) break;
  }
  return out;
}

const MAX_LEN_BY_REF = (ref: string) =>
  ref === "headline" ? 100 : ref.endsWith(":text") ? 1500 : 300;

/** Tailoring output: only refs that exist in this resume, one suggestion per ref, honesty-flagged (plan 7.3). */
export function cleanTailor(
  out: z.infer<typeof tailorOutput>,
  units: TextUnit[],
  source: string,
): TailorAnalysis {
  const byRef = new Map(units.map((u) => [u.ref, u]));
  const used = new Set<string>();
  const suggestions: TailorSuggestion[] = [];

  for (const s of out.suggestions) {
    const unit = byRef.get(s.ref);
    const proposed = s.proposed.trim();
    if (!unit || used.has(s.ref)) continue; // invented or duplicate target → dropped
    if (!proposed || proposed.length > MAX_LEN_BY_REF(s.ref) || proposed === unit.text) continue;
    used.add(s.ref);
    suggestions.push({
      ref: s.ref,
      label: unit.context ? `${unit.section} — ${unit.context}` : unit.section,
      original: unit.text,
      proposed,
      reason: s.reason.trim().slice(0, 300),
      flags: findNewFacts(proposed, source),
      status: "pending",
    });
    if (suggestions.length === 8) break;
  }

  return {
    matchedKeywords: clip(out.matched_keywords, 20, 60),
    missingKeywords: clip(out.missing_keywords, 20, 60),
    gaps: clip(out.gaps, 8, 300),
    suggestions,
  };
}
