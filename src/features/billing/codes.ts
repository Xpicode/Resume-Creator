import "server-only";
import { createHash, randomInt } from "node:crypto";

// Pass codes look like JHP-7KQM-X3PD-9RTW: 12 random characters from an alphabet without the
// look-alikes 0/O, 1/I/L (easy to read out over chat). 30^12 ≈ 5×10^17 — not guessable,
// and redeeming is rate-limited on top.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const PREFIX = "JHP";

export function newPassCode(): string {
  const chars = Array.from({ length: 12 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
  return `${PREFIX}-${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8)}`;
}

/** What the customer typed → the canonical form, or null if it can't be a code. Forgives case, spaces, dashes and a missing prefix. */
export function normalizePassCode(input: string): string | null {
  let s = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (s.length === 12) s = PREFIX + s;
  return s.length === 15 && s.startsWith(PREFIX) ? s : null;
}

/** The database stores only this hash. */
export function hashPassCode(normalized: string): string {
  return createHash("sha256").update(normalized).digest("hex");
}

export const codeHint = (code: string) => code.slice(-4);
