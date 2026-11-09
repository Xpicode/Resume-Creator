import type { ResumeContent } from "./schema";
import { SECTIONS } from "./sections";

/**
 * The pieces of a resume the AI may rephrase, each with a stable reference:
 *   "headline", "<itemId>:text" (summary), "<itemId>:bullets:<n>".
 * Only these can ever be changed by a suggestion (plan 7.3: refs must exist in the user's resume).
 */
export type TextUnit = { ref: string; section: string; context: string; text: string };

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

export function textUnits(content: ResumeContent): TextUnit[] {
  const units: TextUnit[] = [];
  const headline = str(content.personal.headline);
  if (headline) units.push({ ref: "headline", section: "Headline", context: "", text: headline });

  for (const section of content.sections) {
    if (!section.isVisible) continue;
    const label = SECTIONS[section.type].label;
    for (const item of section.items) {
      if (section.type === "summary" && str(item.text)) {
        units.push({ ref: `${item.id}:text`, section: label, context: "", text: str(item.text) });
      }
      if (Array.isArray(item.bullets)) {
        const context = [item.role, item.name, item.title, item.company, item.subtitle]
          .map(str)
          .filter(Boolean)
          .join(" — ");
        item.bullets.forEach((b, n) => {
          if (str(b))
            units.push({ ref: `${item.id}:bullets:${n}`, section: label, context, text: str(b) });
        });
      }
    }
  }
  return units;
}

/** Everything the user wrote except contact details, as plain text (for the honesty check and ATS keyword match). */
export function resumePlainText(content: ResumeContent): string {
  const parts: string[] = [str(content.personal.headline)];
  for (const section of content.sections) {
    if (!section.isVisible) continue;
    parts.push(section.title);
    for (const item of section.items) {
      for (const [key, value] of Object.entries(item)) {
        if (key === "id" || key === "number") continue; // ids and license numbers are not resume prose
        if (typeof value === "string") parts.push(value);
        else if (typeof value === "number") parts.push(String(value));
        else if (Array.isArray(value)) parts.push(...value);
      }
    }
  }
  return parts.filter(Boolean).join("\n");
}

/** Replaces the text at `ref`. Returns null if the ref doesn't exist or the text there changed since `expected`. */
export function replaceUnit(
  content: ResumeContent,
  ref: string,
  expected: string,
  next: string,
): ResumeContent | null {
  const copy = structuredClone(content);
  if (ref === "headline") {
    if (str(copy.personal.headline) !== expected) return null;
    copy.personal.headline = next;
    return copy;
  }
  const [itemId, field, index] = ref.split(":");
  for (const section of copy.sections) {
    const item = section.items.find((i) => i.id === itemId);
    if (!item) continue;
    if (field === "text" && section.type === "summary") {
      if (str(item.text) !== expected) return null;
      item.text = next;
      return copy;
    }
    if (field === "bullets" && Array.isArray(item.bullets)) {
      const n = Number(index);
      if (!Number.isInteger(n) || str(item.bullets[n]) !== expected) return null;
      item.bullets[n] = next;
      return copy;
    }
  }
  return null;
}
