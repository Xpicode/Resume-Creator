import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

// Service-role operations (bypass RLS). Callers must have already proven who the user is.

const BUCKET = "photos";

async function listPhotoPaths(admin: SupabaseClient, userId: string): Promise<string[]> {
  const { data: folders, error } = await admin.storage.from(BUCKET).list(userId, { limit: 1000 });
  if (error) throw error;
  const paths: string[] = [];
  for (const folder of folders ?? []) {
    const { data: files, error: e } = await admin.storage
      .from(BUCKET)
      .list(`${userId}/${folder.name}`, { limit: 100 });
    if (e) throw e;
    for (const f of files ?? []) paths.push(`${userId}/${folder.name}/${f.name}`);
  }
  return paths;
}

/** Hard delete (plan 6.8): photos through the Storage API, then the auth user — rows cascade. */
export async function deleteUserCompletely(admin: SupabaseClient, userId: string): Promise<void> {
  const paths = await listPhotoPaths(admin, userId);
  if (paths.length) {
    const { error } = await admin.storage.from(BUCKET).remove(paths);
    if (error) throw error;
  }
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw error;
}

/**
 * Moves a guest's resumes and photos into the account they just logged into, then deletes the guest.
 * The target may go over the Free resume limit this way — losing the guest's work would be worse.
 */
export async function mergeGuestInto(
  admin: SupabaseClient,
  guestId: string,
  targetId: string,
): Promise<number> {
  if (guestId === targetId) return 0;
  const { data, error } = await admin.auth.admin.getUserById(guestId);
  if (error || !data.user?.is_anonymous) return 0; // only ever merge FROM a guest account

  const { data: moved, error: moveError } = await admin
    .from("resumes")
    .update({ user_id: targetId })
    .eq("user_id", guestId)
    .select("id");
  if (moveError) throw moveError;
  // Share links follow their resume, so a link the guest already sent keeps working.
  const { error: shareError } = await admin
    .from("resume_shares")
    .update({ user_id: targetId })
    .eq("user_id", guestId);
  if (shareError) throw shareError;

  for (const path of await listPhotoPaths(admin, guestId)) {
    const to = `${targetId}/${path.slice(guestId.length + 1)}`;
    const { error: e } = await admin.storage.from(BUCKET).move(path, to);
    if (e) throw e;
  }

  await deleteUserCompletely(admin, guestId);
  return moved?.length ?? 0;
}

/** Cleanup job (plan 6.8): AI suggestions are kept 90 days. */
export async function deleteOldAiSuggestions(admin: SupabaseClient): Promise<void> {
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await admin.from("ai_suggestions").delete().lt("created_at", cutoff);
  if (error) throw error;
}

/** Cleanup job: rate-limit counters only matter for a day (the longest window). */
export async function deleteOldRateLimitHits(admin: SupabaseClient): Promise<void> {
  const cutoff = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await admin.from("rate_limit_hits").delete().lt("created_at", cutoff);
  if (error) throw error;
}

/** Cleanup job (plan 6.2): guests with no activity for 30 days. */
export async function deleteStaleGuests(admin: SupabaseClient): Promise<number> {
  const { data, error } = await admin.rpc("stale_anonymous_user_ids");
  if (error) throw error;
  const ids = (data ?? []) as string[];
  for (const id of ids) await deleteUserCompletely(admin, id);
  return ids.length;
}
