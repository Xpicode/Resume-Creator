import "server-only";
import { randomInt } from "node:crypto";
import { cache } from "react";
import { loadResume, type Resume } from "@/features/resume/queries";
import { supabaseAdmin } from "@/lib/supabase/admin";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
export const SLUG_PATTERN = /^[A-Za-z0-9]{16}$/;

/** 16 random base-62 characters from the CSPRNG (≈ 95 bits): links can't be guessed or listed. */
export function newSlug(): string {
  return Array.from({ length: 16 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
}

/**
 * What a public link may show. Never: the photo (a face on a public URL is easy to scrape) or the
 * optional PH details (birthdate, civil status, sex, nationality) — even if the owner prints them
 * on their own PDF. Phone, email and full address only if the owner allowed it. Hidden values are
 * blanked, not just switched off, so no later rendering path can leak them.
 */
export function publicVersion(resume: Resume, showContact: boolean): Resume {
  const personal = {
    ...resume.content.personal,
    birthdate: undefined,
    civilStatus: undefined,
    sex: undefined,
    nationality: undefined,
  };
  const fullAddress = showContact && resume.settings.show?.fullAddress === true;
  if (!showContact) {
    personal.email = "";
    personal.phone = "";
  }
  if (!fullAddress) personal.fullAddress = "";
  return {
    ...resume,
    settings: { ...resume.settings, show: { fullAddress } },
    content: { ...resume.content, personal },
  };
}

export type SharedResume = { resume: Resume; ownerId: string; allowIndexing: boolean };

/** Loads a shared resume by slug (server only — the table isn't readable by visitors). */
export const loadShared = cache(async (slug: string): Promise<SharedResume | null> => {
  if (!SLUG_PATTERN.test(slug)) return null;
  const admin = supabaseAdmin();
  const { data: share } = await admin
    .from("resume_shares")
    .select("resume_id, user_id, show_contact, allow_indexing")
    .eq("slug", slug)
    .maybeSingle();
  if (!share) return null;
  const loaded = await loadResume(admin, share.user_id, share.resume_id);
  if (!loaded.ok) return null;
  return {
    resume: publicVersion(loaded.resume, share.show_contact),
    ownerId: share.user_id,
    allowIndexing: share.allow_indexing,
  };
});

export async function countShareView(slug: string): Promise<void> {
  await supabaseAdmin().rpc("count_share_view", { share_slug: slug });
}
