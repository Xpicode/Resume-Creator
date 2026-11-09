import type { SupabaseClient, User } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  adminClient,
  browserClient,
  deleteUsers,
  hasDb,
  newAnonymousUser,
  newUser,
  type TestUser,
} from "./helpers";

// Plan Phase 4 task 2 done-when: share links can't be guessed or found by search engines unless the
// user allows it; off by default, revocable, contact details hideable.
const session: { user: User | null; client: SupabaseClient | null } = { user: null, client: null };
vi.mock("@/lib/auth", async (orig) => ({
  ...(await orig<typeof import("@/lib/auth")>()),
  requireUser: async () => session.user!,
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => session.client }));

const { enableShare, disableShare, updateShare } = await import("@/features/share/actions");
const { loadShared, newSlug, SLUG_PATTERN } = await import("@/features/share/share");
const { GET: sharedPdf } = await import("@/app/r/[slug]/pdf/route");
const { mergeGuestInto } = await import("@/features/account/admin-ops");

const CONTENT = {
  version: 1,
  personal: {
    firstName: "Ana",
    lastName: "Reyes",
    headline: "Staff Nurse",
    email: "ana.secret@example.com",
    phone: "0917 111 2222",
    cityProvince: "Pasig City",
    fullAddress: "123 Secret St., Pasig City",
    birthdate: "2001-05-04",
    civilStatus: "Single",
  },
  sections: [],
};

async function signedIn(u: TestUser) {
  session.user = (await adminClient().auth.admin.getUserById(u.id)).data.user;
  session.client = u.client;
}

async function newResume(u: TestUser, settings: object = {}) {
  const { data, error } = await u.client
    .from("resumes")
    .insert({ title: "Shared", content: CONTENT, settings })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

const form = (fields: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
};

async function run(action: (fd: FormData) => Promise<void>, fields: Record<string, string>) {
  try {
    await action(form(fields));
  } catch (e) {
    if (!String((e as { digest?: string }).digest).startsWith("NEXT_REDIRECT")) throw e;
  }
}

const slugOf = async (resumeId: string) =>
  (await adminClient().from("resume_shares").select("slug").eq("resume_id", resumeId).maybeSingle())
    .data?.slug as string | undefined;

describe("share slugs", () => {
  it("are 16 random letters/digits", () => {
    const slugs = new Set(Array.from({ length: 1000 }, newSlug));
    expect(slugs.size).toBe(1000);
    for (const s of slugs) expect(s).toMatch(SLUG_PATTERN);
  });
});

describe.skipIf(!hasDb)("share links", () => {
  let a: TestUser;
  let b: TestUser;
  let resume: string;
  beforeAll(async () => {
    [a, b] = await Promise.all([newUser(), newUser()]);
    resume = await newResume(a);
  });
  afterAll(() => deleteUsers(a, b));

  it("is off by default; turning it on makes a random link", async () => {
    expect(await slugOf(resume)).toBeUndefined();
    await signedIn(a);
    await run(enableShare, { resumeId: resume });
    expect(await slugOf(resume)).toMatch(SLUG_PATTERN);
  });

  it("hides phone, email, full address, photo and optional details by default", async () => {
    const shared = await loadShared((await slugOf(resume))!);
    const p = shared!.resume.content.personal;
    expect([p.email, p.phone]).toEqual(["", ""]);
    expect(shared!.resume.settings.show).toEqual({ fullAddress: false }); // photo and PH details off
    expect(shared!.allowIndexing).toBe(false);
    expect(JSON.stringify(shared!.resume)).not.toMatch(/ana\.secret|0917 111|Secret St/);
  });

  it("never shows optional PH details on the link, even if the owner's PDF shows them", async () => {
    const c = await newUser(); // Free plan = 1 resume each
    try {
      const r = await newResume(c, { show: { birthdate: true, civilStatus: true, photo: true } });
      await signedIn(c);
      await run(enableShare, { resumeId: r });
      const shared = await loadShared((await slugOf(r))!);
      expect(JSON.stringify(shared!.resume)).not.toMatch(/2001-05-04|Single/);
      expect(shared!.resume.settings.show).toEqual({ fullAddress: false });
    } finally {
      await deleteUsers(c);
    }
  });

  it("shows contact details only after the owner allows it", async () => {
    await signedIn(a);
    await run(updateShare, { resumeId: resume, showContact: "on" });
    const shared = await loadShared((await slugOf(resume))!);
    expect(shared!.resume.content.personal.email).toBe("ana.secret@example.com");
    expect(shared!.resume.settings.show?.photo).not.toBe(true); // photo stays off regardless
    expect(shared!.allowIndexing).toBe(false);
  });

  it("the public PDF works, is noindex, and dies when the link is turned off", async () => {
    const slug = (await slugOf(resume))!;
    const pdf = (s: string) =>
      sharedPdf(new Request(`http://x/r/${s}/pdf`), { params: Promise.resolve({ slug: s }) });
    const ok = await pdf(slug);
    expect(ok.status).toBe(200);
    expect(ok.headers.get("x-robots-tag")).toBe("noindex");

    await signedIn(a);
    await run(disableShare, { resumeId: resume });
    expect(await loadShared(slug)).toBeNull();
    expect((await pdf(slug)).status).toBe(404);

    await run(enableShare, { resumeId: resume });
    const fresh = await slugOf(resume);
    expect(fresh).toMatch(SLUG_PATTERN);
    expect(fresh).not.toBe(slug); // re-enabling never brings the old link back
  });

  it("unknown or malformed links find nothing", async () => {
    expect(await loadShared(newSlug())).toBeNull();
    expect(await loadShared("../../etc/passwd")).toBeNull();
    expect(await loadShared("short")).toBeNull();
  });

  it("other users and visitors can't read, create, change or count shares", async () => {
    const anon = browserClient();
    expect((await anon.from("resume_shares").select("slug")).data ?? []).toEqual([]);
    expect((await b.client.from("resume_shares").select("slug")).data).toEqual([]);

    const intoA = await b.client
      .from("resume_shares")
      .insert({ resume_id: resume, user_id: b.id, slug: newSlug() });
    expect(intoA.error).not.toBeNull();

    const own = await a.client
      .from("resume_shares")
      .update({ slug: "AAAAAAAAAAAAAAAA" })
      .eq("resume_id", resume);
    expect(own.error).not.toBeNull(); // owners can't pick their slug or edit the view count
    const views = await a.client
      .from("resume_shares")
      .update({ views: 999 })
      .eq("resume_id", resume);
    expect(views.error).not.toBeNull();

    expect(
      (await a.client.rpc("count_share_view", { share_slug: (await slugOf(resume))! })).error,
    ).not.toBeNull();
  });

  it("a guest's link keeps working after the guest creates an account", async () => {
    const guest = await newAnonymousUser();
    const target = await newUser();
    try {
      const guestResume = await newResume(guest);
      await signedIn(guest);
      await run(enableShare, { resumeId: guestResume });
      const slug = (await slugOf(guestResume))!;
      await mergeGuestInto(adminClient(), guest.id, target.id);
      const shared = await loadShared(slug);
      expect(shared?.ownerId).toBe(target.id);
    } finally {
      await deleteUsers(target);
    }
  });

  it("deleting the resume deletes the link", async () => {
    const slug = (await slugOf(resume))!;
    await a.client.from("resumes").delete().eq("id", resume);
    expect(await loadShared(slug)).toBeNull();
  });
});
