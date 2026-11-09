import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  adminClient,
  browserClient,
  deleteUsers,
  hasDb,
  newAnonymousUser,
  newUser,
  type TestUser,
} from "./helpers";

// Plan 1B task 11: prove cross-user access is blocked on every table and the photo bucket,
// and that plan limits hold even when calling the Supabase API directly.
describe.skipIf(!hasDb)("RLS: core tables", () => {
  let a: TestUser;
  let b: TestUser;
  let anon: TestUser;
  let aResumeId: string;

  beforeAll(async () => {
    [a, b, anon] = await Promise.all([newUser(), newUser(), newAnonymousUser()]);
    const { data, error } = await a.client
      .from("resumes")
      .insert({ user_id: a.id, title: "A's resume" })
      .select("id")
      .single();
    if (error) throw error;
    aResumeId = data.id;
  });

  afterAll(() => deleteUsers(a, b, anon));

  describe("resumes", () => {
    it("owner can read and update their resume", async () => {
      const read = await a.client.from("resumes").select("id").eq("id", aResumeId);
      expect(read.data).toHaveLength(1);
      const upd = await a.client
        .from("resumes")
        .update({ title: "Renamed" })
        .eq("id", aResumeId)
        .select("title");
      expect(upd.data?.[0]?.title).toBe("Renamed");
    });

    it("another user cannot read, update or delete it", async () => {
      const read = await b.client.from("resumes").select("id").eq("id", aResumeId);
      expect(read.data).toEqual([]);

      const upd = await b.client
        .from("resumes")
        .update({ title: "hacked" })
        .eq("id", aResumeId)
        .select("id");
      expect(upd.data ?? []).toEqual([]);

      const del = await b.client.from("resumes").delete().eq("id", aResumeId).select("id");
      expect(del.data ?? []).toEqual([]);

      const still = await adminClient()
        .from("resumes")
        .select("title")
        .eq("id", aResumeId)
        .single();
      expect(still.data?.title).not.toBe("hacked");
    });

    it("a user cannot insert a resume for someone else", async () => {
      const { error } = await b.client.from("resumes").insert({ user_id: a.id, title: "x" });
      expect(error).not.toBeNull();
    });

    it("a user cannot move their resume to another user", async () => {
      const { data: own } = await b.client
        .from("resumes")
        .insert({ title: "B's" })
        .select("id")
        .single();
      const { error } = await b.client.from("resumes").update({ user_id: a.id }).eq("id", own!.id);
      expect(error).not.toBeNull();
      await b.client.from("resumes").delete().eq("id", own!.id);
    });

    it("the browser key without a session sees nothing", async () => {
      const { data } = await browserClient().from("resumes").select("id");
      expect(data ?? []).toEqual([]);
    });

    it("stale updated_at matches no row (conflict detection)", async () => {
      const { data } = await a.client
        .from("resumes")
        .update({ title: "x" })
        .eq("id", aResumeId)
        .eq("updated_at", "2000-01-01T00:00:00+00:00")
        .select("id");
      expect(data).toEqual([]);
    });
  });

  describe("plan limits (1 resume for Free and anonymous)", () => {
    it("a second resume is rejected", async () => {
      const { error } = await a.client.from("resumes").insert({ title: "second" });
      expect(error?.message).toContain("resume_limit_reached");
    });

    it("anonymous users are limited too", async () => {
      const first = await anon.client.from("resumes").insert({ title: "anon 1" });
      expect(first.error).toBeNull();
      const second = await anon.client.from("resumes").insert({ title: "anon 2" });
      expect(second.error?.message).toContain("resume_limit_reached");
    });

    it("10 parallel inserts create exactly one resume", async () => {
      const c = await newUser();
      try {
        await Promise.all(
          Array.from({ length: 10 }, (_, i) =>
            c.client.from("resumes").insert({ title: `parallel ${i}` }),
          ),
        );
        const { count } = await adminClient()
          .from("resumes")
          .select("id", { count: "exact", head: true })
          .eq("user_id", c.id);
        expect(count).toBe(1);
      } finally {
        await deleteUsers(c);
      }
    });
  });

  describe("profiles", () => {
    it("are created on sign-up and private to the owner", async () => {
      const own = await a.client.from("profiles").select("id").eq("id", a.id);
      expect(own.data).toHaveLength(1);
      const other = await b.client.from("profiles").select("id").eq("id", a.id);
      expect(other.data).toEqual([]);
      const upd = await b.client
        .from("profiles")
        .update({ display_name: "x" })
        .eq("id", a.id)
        .select("id");
      expect(upd.data ?? []).toEqual([]);
    });
  });

  describe("consents", () => {
    it("can be added for yourself only and read by the owner only", async () => {
      const own = await a.client
        .from("consents")
        .insert({ consent_type: "terms", version: "test" });
      expect(own.error).toBeNull();
      const forOther = await b.client
        .from("consents")
        .insert({ user_id: a.id, consent_type: "terms", version: "test" });
      expect(forOther.error).not.toBeNull();
      const read = await b.client.from("consents").select("id").eq("user_id", a.id);
      expect(read.data).toEqual([]);
    });
  });

  describe("templates", () => {
    it("are readable without a session but not writable", async () => {
      const read = await browserClient().from("templates").select("slug");
      expect(read.data?.map((t) => t.slug).sort()).toEqual(["ats-classic", "ph-traditional"]);
      const write = await a.client.from("templates").insert({
        slug: "evil",
        name: "x",
        is_ats_safe: true,
        supports_photo: false,
      });
      expect(write.error).not.toBeNull();
    });
  });

  describe("photos bucket", () => {
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);

    it("owner can upload into their own folder; others cannot read or overwrite it", async () => {
      const path = `${a.id}/${aResumeId}/photo.jpg`;
      const up = await a.client.storage
        .from("photos")
        .upload(path, jpeg, { contentType: "image/jpeg", upsert: true });
      expect(up.error).toBeNull();

      const read = await b.client.storage.from("photos").download(path);
      expect(read.error).not.toBeNull();

      const overwrite = await b.client.storage
        .from("photos")
        .upload(path, jpeg, { contentType: "image/jpeg", upsert: true });
      expect(overwrite.error).not.toBeNull();

      const intoA = await b.client.storage
        .from("photos")
        .upload(`${a.id}/x/photo.jpg`, jpeg, { contentType: "image/jpeg" });
      expect(intoA.error).not.toBeNull();

      await a.client.storage.from("photos").remove([path]);
    });

    it("is not public", async () => {
      const read = await browserClient()
        .storage.from("photos")
        .download(`${a.id}/${aResumeId}/photo.jpg`);
      expect(read.error).not.toBeNull();
    });
  });

  describe("server-only functions", () => {
    it("cannot be called with a user session", async () => {
      const { error } = await a.client.rpc("stale_anonymous_user_ids");
      expect(error).not.toBeNull();
    });
  });
});
