import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// RLS tests run against a real Supabase (local: `npx supabase start`) and skip when env is missing.
export const url = process.env.SUPABASE_URL;
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;

export const hasDb = Boolean(url && publishableKey && secretKey);

const opts = { auth: { persistSession: false, autoRefreshToken: false } };

export function browserClient(): SupabaseClient {
  return createClient(url!, publishableKey!, opts);
}

export function adminClient(): SupabaseClient {
  return createClient(url!, secretKey!, opts);
}

export type TestUser = { id: string; client: SupabaseClient };

export async function newUser(): Promise<TestUser> {
  const email = `rls-${randomUUID()}@example.com`;
  const password = `pw-${randomUUID()}`;
  const { data, error } = await adminClient().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  const client = browserClient();
  const signIn = await client.auth.signInWithPassword({ email, password });
  if (signIn.error) throw signIn.error;
  return { id: data.user.id, client };
}

export async function newAnonymousUser(): Promise<TestUser> {
  const client = browserClient();
  const { data, error } = await client.auth.signInAnonymously();
  if (error) throw error;
  return { id: data.user!.id, client };
}

export async function deleteUsers(...users: (TestUser | undefined)[]) {
  for (const u of users) if (u) await adminClient().auth.admin.deleteUser(u.id);
}
