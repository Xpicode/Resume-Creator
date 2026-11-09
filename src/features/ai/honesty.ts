/**
 * Honesty check (plan 7.2 rule 3): numbers and proper nouns in an AI suggestion that do not appear
 * anywhere in the user's own resume. A hit shows "This adds details not in your resume — confirm it's true."
 *
 * ponytail: word-level heuristic (capitalised words not at the start of a sentence, acronyms, numbers).
 * It can miss facts written in lower case ("python") and flag harmless capitals. Upgrade path: a second,
 * cheap model call that lists claims and checks them, if real data shows too many misses.
 */

// Capitalised words that are common English, not facts.
const COMMON = new Set(
  "i a an the and or but in on at to for of with by from as is was were be been this that these those my our your their it its we they he she you led".split(
    " ",
  ),
);

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

function numbersIn(text: string): Set<string> {
  return new Set((text.match(/\d+(?:[.,]\d+)*/g) ?? []).map((n) => n.replace(/,/g, "")));
}

function properNounsIn(text: string): string[] {
  const found: string[] = [];
  for (const sentence of text.split(/(?<=[.!?;:])\s+|\n+|^[•\-*]\s*/m)) {
    const words = sentence.trim().split(/\s+/);
    words.forEach((raw, i) => {
      const w = raw.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}+#.]+$/gu, "").replace(/\.$/, "");
      if (!w || /^\d/.test(w)) return;
      const acronym = /^[A-Z][A-Z0-9+#.&]{1,}$/.test(w);
      const capitalised = /^\p{Lu}/u.test(w);
      if (acronym || (capitalised && i > 0 && !COMMON.has(w.toLowerCase()))) found.push(w);
    });
  }
  return found;
}

/** Facts in `proposed` that `source` (all of the user's resume text) doesn't contain. */
export function findNewFacts(proposed: string, source: string): string[] {
  const src = norm(source);
  const srcNumbers = numbersIn(source);
  const flags = new Set<string>();

  for (const n of numbersIn(proposed)) if (!srcNumbers.has(n)) flags.add(n);
  for (const word of properNounsIn(proposed)) {
    const escaped = norm(word).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (!new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}($|[^\\p{L}\\p{N}])`, "u").test(src))
      flags.add(word);
  }
  return [...flags];
}
