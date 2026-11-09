import { describe, expect, it } from "vitest";
import {
  deleteStaleGuests,
  deleteUserCompletely,
  mergeGuestInto,
} from "@/features/account/admin-ops";
import { adminClient, deleteUsers, hasDb, newAnonymousUser, newUser } from "./helpers";

const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4]);

async function resumeWithPhoto(user: { id: string; client: ReturnType<typeof adminClient> }) {
  const { data, error } = await user.client
    .from("resumes")
    .insert({ title: "R" })
    .select("id")
    .single();
  if (error) throw error;
  const path = `${user.id}/${data.id}/photo.jpg`;
  const up = await user.client.storage
    .from("photos")
    .upload(path, jpeg, { contentType: "image/jpeg" });
  if (up.error) throw up.error;
  return { resumeId: data.id as string, path };
}

describe.skipIf(!hasDb)("account operations", () => {
  it("account deletion removes all rows and photo files (plan Phase 1 done-when)", async () => {
    const admin = adminClient();
    const u = await newUser();
    const { path } = await resumeWithPhoto(u);
    await u.client.from("consents").insert({ consent_type: "terms", version: "t" });
    const { data: r } = await u.client.from("resumes").select("id").single();
    await admin.rpc("consume_ai_credits", { uid: u.id, amount: 1 });
    await admin
      .from("ai_usage")
      .insert({ user_id: u.id, feature: "tailor", model: "m", status: "ok" });
    const { data: jt } = await u.client
      .from("job_targets")
      .insert({ resume_id: r!.id, job_description: "x" })
      .select("id")
      .single();
    await u.client
      .from("ai_suggestions")
      .insert({ resume_id: r!.id, job_target_id: jt!.id, feature: "tailor", payload: {} });
    // Make sure the rows really existed before deletion.
    expect((await admin.from("job_targets").select("id").eq("user_id", u.id)).data).toHaveLength(1);
    expect((await admin.from("ai_suggestions").select("id").eq("user_id", u.id)).data).toHaveLength(
      1,
    );
    expect((await admin.from("entitlements").select("id").eq("user_id", u.id)).data).toHaveLength(
      1,
    );

    await deleteUserCompletely(admin, u.id);

    const tables = [
      "profiles",
      "resumes",
      "consents",
      "entitlements",
      "ai_usage",
      "job_targets",
      "ai_suggestions",
    ] as const;
    for (const table of tables) {
      const col = table === "profiles" ? "id" : "user_id";
      const { count } = await admin
        .from(table)
        .select("*", { count: "exact", head: true })
        .eq(col, u.id);
      expect(count, table).toBe(0);
    }
    const file = await admin.storage.from("photos").download(path);
    expect(file.error).not.toBeNull();
    const authUser = await admin.auth.admin.getUserById(u.id);
    expect(authUser.data.user).toBeNull();
  });

  it("merges a guest's resume and photo into an existing account, then deletes the guest", async () => {
    const admin = adminClient();
    const guest = await newAnonymousUser();
    const target = await newUser();
    try {
      const { resumeId } = await resumeWithPhoto(guest);

      const moved = await mergeGuestInto(admin, guest.id, target.id);

      expect(moved).toBe(1);
      const { data } = await target.client.from("resumes").select("id");
      expect(data?.map((r) => r.id)).toEqual([resumeId]);
      const photo = await target.client.storage
        .from("photos")
        .download(`${target.id}/${resumeId}/photo.jpg`);
      expect(photo.error).toBeNull();
      expect((await admin.auth.admin.getUserById(guest.id)).data.user).toBeNull();
    } finally {
      await deleteUsers(target);
    }
  });

  it("never merges FROM a real account", async () => {
    const admin = adminClient();
    const victim = await newUser();
    const attacker = await newUser();
    try {
      await victim.client.from("resumes").insert({ title: "victim's" });
      expect(await mergeGuestInto(admin, victim.id, attacker.id)).toBe(0);
      const { count } = await admin
        .from("resumes")
        .select("*", { count: "exact", head: true })
        .eq("user_id", victim.id);
      expect(count).toBe(1);
    } finally {
      await deleteUsers(victim, attacker);
    }
  });

  it("cleanup deletes guests inactive for 30 days but keeps recent ones", async () => {
    const admin = adminClient();
    const stale = await newAnonymousUser();
    const fresh = await newAnonymousUser();
    try {
      // test_backdate_user exists only in the local seed (supabase/seed.sql).
      const { error } = await admin.rpc("test_backdate_user", { uid: stale.id, days: 31 });
      if (error) throw error;

      await deleteStaleGuests(admin);

      expect((await admin.auth.admin.getUserById(stale.id)).data.user).toBeNull();
      expect((await admin.auth.admin.getUserById(fresh.id)).data.user).not.toBeNull();
    } finally {
      await deleteUsers(fresh);
    }
  });
});
