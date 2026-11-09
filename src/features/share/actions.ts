"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { newSlug } from "./share";

const resumeId = z.uuid();

function idFrom(fd: FormData): string {
  const id = resumeId.safeParse(fd.get("resumeId"));
  if (!id.success) redirect("/dashboard");
  return id.data;
}

/** Turns the public link on with a fresh random slug. RLS checks the resume is the user's. */
export async function enableShare(fd: FormData): Promise<void> {
  const user = await requireUser();
  const id = idFrom(fd);
  const supabase = await createClient();
  const { error } = await supabase
    .from("resume_shares")
    .insert({ resume_id: id, user_id: user.id, slug: newSlug() });
  // 23505 = already shared (double click): fine, keep the existing link.
  if (error && error.code !== "23505") redirect(`/resumes/${id}/share?error=1`);
  redirect(`/resumes/${id}/share`);
}

/** Turns it off: the row is deleted, so the old link stops working for good. */
export async function disableShare(fd: FormData): Promise<void> {
  const user = await requireUser();
  const id = idFrom(fd);
  const supabase = await createClient();
  await supabase.from("resume_shares").delete().eq("resume_id", id).eq("user_id", user.id);
  redirect(`/resumes/${id}/share?off=1`);
}

export async function updateShare(fd: FormData): Promise<void> {
  const user = await requireUser();
  const id = idFrom(fd);
  const supabase = await createClient();
  await supabase
    .from("resume_shares")
    .update({
      show_contact: fd.get("showContact") === "on",
      allow_indexing: fd.get("allowIndexing") === "on",
    })
    .eq("resume_id", id)
    .eq("user_id", user.id);
  redirect(`/resumes/${id}/share?saved=1`);
}
