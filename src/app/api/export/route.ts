import { getUser, hasRecentLogin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NO_STORE } from "@/features/resume/route-helpers";

/** "Download my data" (Data Privacy Act right of access, plan 6.8). Requires a recent login. */
export async function GET(request: Request) {
  const user = await getUser();
  if (!user) return new Response(null, { status: 401, headers: NO_STORE });
  if (!hasRecentLogin(user)) {
    return Response.redirect(new URL("/login?reauth=1&next=/settings", request.url), 303);
  }

  const supabase = await createClient();
  const own = (table: string, columns: string) =>
    supabase.from(table).select(columns).eq("user_id", user.id);
  const [profile, resumes, consents, jobPosts, suggestions, usage, plans] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, onboarding_goal, locale, created_at")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("resumes")
      .select("id, title, template_slug, paper_size, settings, content, created_at, updated_at")
      .eq("user_id", user.id),
    supabase
      .from("consents")
      .select("consent_type, version, granted_at, withdrawn_at")
      .eq("user_id", user.id),
    own("job_targets", "resume_id, company, position, job_description, created_at"),
    own("ai_suggestions", "resume_id, feature, payload, status, created_at"),
    own("ai_usage", "feature, model, input_tokens, output_tokens, status, created_at"),
    own("entitlements", "plan, ai_credits_remaining, starts_at, ends_at"),
  ]);

  const body = {
    exported_at: new Date().toISOString(),
    account: {
      email: user.email ?? null,
      guest: Boolean(user.is_anonymous),
      created_at: user.created_at,
    },
    profile: profile.data,
    resumes: resumes.data ?? [],
    consents: consents.data ?? [],
    job_posts: jobPosts.data ?? [],
    ai_suggestions: suggestions.data ?? [],
    ai_usage: usage.data ?? [],
    plans: plans.data ?? [],
    note: "Profile photos are not included in this file. Download them from the resume editor.",
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      ...NO_STORE,
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="my-resume-data.json"',
    },
  });
}
