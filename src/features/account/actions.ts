"use server";

import { redirect } from "next/navigation";
import { getUser, hasRecentLogin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { deleteUserCompletely } from "./admin-ops";

export type DeleteState = { status: "idle" | "error"; message?: string };

/** Delete account (plan 6.8): recent login + typed confirmation, then a full hard delete. */
export async function deleteAccount(_prev: DeleteState, fd: FormData): Promise<DeleteState> {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!hasRecentLogin(user)) redirect("/login?reauth=1&next=/settings");
  if (fd.get("confirm") !== "DELETE")
    return { status: "error", message: "Type DELETE (in capital letters) to confirm." };

  await deleteUserCompletely(supabaseAdmin(), user.id);
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect("/?deleted=1");
}
