"use server";

import { z } from "zod";
import { runAtsCheck, type AtsResult } from "@/features/ats/check";
import { loadResume, type Resume } from "@/features/resume/queries";
import { renderForResume } from "@/features/resume/route-helpers";
import { replaceUnit, resumePlainText, textUnits } from "@/features/resume/text-units";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { pdfPageCount } from "@/pdf/render-image";
import { AI_CONSENT_VERSION, MAX_JOB_DESCRIPTION_CHARS } from "./config";
import { fail, withAi, type AiFailure } from "./guard";
import { callClaude } from "./provider";
import { bulletPrompt, summaryPrompt, tailorPrompt } from "./prompts";
import {
  cleanOptions,
  cleanTailor,
  optionsOutput,
  tailorOutput,
  type Option,
  type TailorAnalysis,
} from "./results";

// Server actions are public endpoints: every one checks the user and ownership itself (plan 6.3).

const uuid = z.uuid();
type OptionsResult = { ok: true; options: Option[]; creditsLeft: number } | AiFailure;

async function ownResume(userId: string, id: string): Promise<Resume | null> {
  const loaded = await loadResume(await createClient(), userId, id);
  return loaded.ok ? loaded.resume : null;
}

/** "✨ Improve" on one bullet: 2–3 rewrites (plan 7.1). Reads the saved resume, never text from the browser. */
export async function improveBullet(
  resumeId: string,
  itemId: string,
  index: number,
): Promise<OptionsResult> {
  if (
    !uuid.safeParse(resumeId).success ||
    !uuid.safeParse(itemId).success ||
    !Number.isInteger(index)
  ) {
    return fail("failed");
  }
  const result = await withAi("improve_bullet", async ({ user }) => {
    const resume = await ownResume(user.id, resumeId);
    const unit =
      resume && textUnits(resume.content).find((u) => u.ref === `${itemId}:bullets:${index}`);
    if (!resume || !unit) return fail("failed");
    const call = await callClaude(
      "improve_bullet",
      bulletPrompt({ bullet: unit.text, context: unit.context, section: unit.section }),
      optionsOutput,
    );
    if (!call.ok) return call;
    const options = cleanOptions(
      call.data.options,
      unit.text,
      resumePlainText(resume.content),
      300,
    );
    return options.length
      ? { ...call, data: options }
      : { ok: false as const, reason: "invalid" as const, usage: call.usage };
  });
  return result.ok ? { ok: true, options: result.data, creditsLeft: result.creditsLeft } : result;
}

/** "✨ Write summary" from the user's own sections (plan 7.1). */
export async function writeSummary(resumeId: string): Promise<OptionsResult> {
  if (!uuid.safeParse(resumeId).success) return fail("failed");
  const result = await withAi("write_summary", async ({ user }) => {
    const resume = await ownResume(user.id, resumeId);
    if (!resume) return fail("failed");
    const units = textUnits(resume.content).filter((u) => !u.ref.endsWith(":text"));
    const plain = resumePlainText(resume.content);
    const call = await callClaude(
      "write_summary",
      summaryPrompt(
        units.length ? units : [{ ref: "all", section: "Resume", context: "", text: plain }],
        resume.content.personal.headline ?? "",
      ),
      optionsOutput,
    );
    if (!call.ok) return call;
    const options = cleanOptions(call.data.options, "", plain, 1500, 2);
    return options.length
      ? { ...call, data: options }
      : { ok: false as const, reason: "invalid" as const, usage: call.usage };
  });
  return result.ok ? { ok: true, options: result.data, creditsLeft: result.creditsLeft } : result;
}

const tailorInput = z.strictObject({
  company: z.string().trim().max(150),
  position: z.string().trim().max(150),
  jobDescription: z
    .string()
    .trim()
    .min(50, "Paste the full job post (at least a few lines).")
    .max(MAX_JOB_DESCRIPTION_CHARS),
});

export type TailorResult =
  | { ok: true; setId: string; analysis: TailorAnalysis; ats: AtsResult; creditsLeft: number }
  | AiFailure
  | { ok: false; code: "invalid"; message: string };

/** Tailor to a job post (plan 5.3): keyword match, gaps, before → after suggestions. Nothing is applied yet. */
export async function tailorResume(resumeId: string, input: unknown): Promise<TailorResult> {
  if (!uuid.safeParse(resumeId).success) return fail("failed");
  const parsed = tailorInput.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      code: "invalid",
      message: parsed.error.issues[0]?.message ?? "Check the job post.",
    };
  const job = parsed.data;

  let saved: { setId: string; ats: AtsResult } | undefined;
  const result = await withAi("tailor", async ({ user, supabase }) => {
    const resume = await ownResume(user.id, resumeId);
    if (!resume) return fail("failed");
    const units = textUnits(resume.content);
    const plain = resumePlainText(resume.content);
    const call = await callClaude(
      "tailor",
      tailorPrompt({
        units,
        otherText: plain,
        company: job.company,
        position: job.position,
        jobDescription: job.jobDescription,
      }),
      tailorOutput,
    );
    if (!call.ok) return call;
    const analysis = cleanTailor(call.data, units, plain);

    const { data: target } = await supabase
      .from("job_targets")
      .insert({
        user_id: user.id,
        resume_id: resumeId,
        company: job.company,
        position: job.position,
        job_description: job.jobDescription,
      })
      .select("id")
      .single();
    const { data: set } = await supabase
      .from("ai_suggestions")
      .insert({
        user_id: user.id,
        resume_id: resumeId,
        job_target_id: target?.id,
        feature: "tailor",
        payload: analysis,
      })
      .select("id")
      .single();
    if (!set) return fail("failed");
    saved = { setId: set.id, ats: runAtsCheck({ ...resume, jobDescription: job.jobDescription }) };
    return { ...call, data: analysis };
  });

  if (!result.ok) return result;
  return {
    ok: true,
    setId: saved!.setId,
    ats: saved!.ats,
    analysis: result.data,
    creditsLeft: result.creditsLeft,
  };
}

export type DecideResult = { ok: true; analysis: TailorAnalysis } | { ok: false; message: string };

/** Accept (optionally edited) or dismiss one tailoring suggestion. Accepting edits the saved resume. */
export async function decideSuggestion(
  setId: string,
  index: number,
  decision: "apply" | "dismiss",
  editedText?: string,
): Promise<DecideResult> {
  const user = await getUser();
  if (!user || !uuid.safeParse(setId).success || !Number.isInteger(index))
    return { ok: false, message: "Not allowed." };
  const supabase = await createClient();
  const { data: set } = await supabase
    .from("ai_suggestions")
    .select("id, resume_id, payload")
    .eq("id", setId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!set) return { ok: false, message: "Suggestion not found." };

  const analysis = set.payload as TailorAnalysis;
  const s = analysis.suggestions?.[index];
  if (!s || s.status !== "pending")
    return { ok: false, message: "This suggestion was already handled." };

  if (decision === "apply") {
    const text = (editedText ?? s.proposed).trim();
    const max = s.ref === "headline" ? 100 : s.ref.endsWith(":text") ? 1500 : 300;
    if (!text || text.length > max)
      return { ok: false, message: `Keep it between 1 and ${max} characters.` };

    const resume = await ownResume(user.id, set.resume_id);
    const next = resume && replaceUnit(resume.content, s.ref, s.original, text);
    if (!resume || !next) {
      return {
        ok: false,
        message: "That part of your resume changed since the suggestion. Run tailoring again.",
      };
    }
    const { data: updated } = await supabase
      .from("resumes")
      .update({ content: next })
      .eq("id", resume.id)
      .eq("user_id", user.id)
      .eq("updated_at", resume.updatedAt)
      .select("id")
      .maybeSingle();
    if (!updated)
      return { ok: false, message: "Your resume was just changed elsewhere. Try again." };
    s.proposed = text;
  }

  s.status = decision === "apply" ? "applied" : "dismissed";
  const done = analysis.suggestions.every((x) => x.status !== "pending");
  const anyApplied = analysis.suggestions.some((x) => x.status === "applied");
  await supabase
    .from("ai_suggestions")
    .update({
      payload: analysis,
      status: done ? (anyApplied ? "applied" : "dismissed") : "pending",
    })
    .eq("id", setId)
    .eq("user_id", user.id);
  return { ok: true, analysis };
}

/** Settings → AI processing (plan 8 Phase 2 task 10). Withdrawing keeps the history (consents are append-only). */
export async function setAiConsent(on: boolean): Promise<{ ok: boolean }> {
  const user = await getUser();
  if (!user || user.is_anonymous) return { ok: false };
  const supabase = await createClient();
  if (on) {
    await supabase
      .from("consents")
      .insert({ user_id: user.id, consent_type: "ai_processing", version: AI_CONSENT_VERSION });
  } else {
    await supabase
      .from("consents")
      .update({ withdrawn_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("consent_type", "ai_processing")
      .is("withdrawn_at", null);
  }
  return { ok: true };
}

/** Rule-based ATS check (plan 7.5). Free, no AI, works for guests too. */
export async function checkAts(
  resumeId: string,
  jobDescription?: string,
): Promise<{ ok: true; result: AtsResult } | { ok: false }> {
  const user = await getUser();
  if (!user) return { ok: false };
  const resume = await ownResume(user.id, resumeId);
  if (!resume) return { ok: false };
  const jd =
    typeof jobDescription === "string"
      ? jobDescription.slice(0, MAX_JOB_DESCRIPTION_CHARS)
      : undefined;
  const pageCount = await pdfPageCount(await renderForResume(resume, user.id));
  return { ok: true, result: runAtsCheck({ ...resume, pageCount, jobDescription: jd }) };
}
