import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * A guest (anonymous) who logs into an EXISTING account would lose their resume, because Supabase
 * can't attach that account to the guest. Before switching accounts we put the guest's user id in
 * a signed, short-lived, httpOnly cookie; after login the server moves the guest's resumes over.
 * The signature proves the cookie was issued by us while the guest session was active.
 */

export const MERGE_COOKIE = "merge_ticket";
export const MERGE_TTL_SECONDS = 15 * 60;

const b64 = (s: string) => Buffer.from(s).toString("base64url");
const sign = (payload: string, secret: string) =>
  createHmac("sha256", secret).update(payload).digest("base64url");

export function createMergeTicket(anonUserId: string, secret: string, now = Date.now()): string {
  const payload = b64(JSON.stringify({ anon: anonUserId, exp: now + MERGE_TTL_SECONDS * 1000 }));
  return `${payload}.${sign(payload, secret)}`;
}

/** The guest user id, or null if the ticket is missing, tampered with or expired. */
export function readMergeTicket(
  ticket: string | undefined,
  secret: string,
  now = Date.now(),
): string | null {
  if (!ticket) return null;
  const [payload, sig] = ticket.split(".");
  if (!payload || !sig) return null;
  const expected = Buffer.from(sign(payload, secret));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as {
      anon?: unknown;
      exp?: unknown;
    };
    if (typeof data.anon !== "string" || typeof data.exp !== "number" || data.exp < now)
      return null;
    return data.anon;
  } catch {
    return null;
  }
}
