"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { buttonClass, inputClass } from "@/components/ui";
import type { AtsResult } from "@/features/ats/check";
import { AiNotice, AiProvider, useAi } from "@/features/editor/ai";
import { AtsChecklist } from "@/features/editor/ats-panel";
import { decideSuggestion, tailorResume } from "./actions";
import { AI_FEATURES, MAX_JOB_DESCRIPTION_CHARS } from "./config";
import type { AiBlock } from "./guard";
import type { TailorAnalysis } from "./results";

type Props = { resumeId: string; title: string; ai: { block: AiBlock | null; credits: number } };

/** Tailor to a job post (plan 5.3): paste → analysis → before/after cards with Accept / Edit / Dismiss. */
export function TailorWorkspace(props: Props) {
  return (
    <AiProvider
      value={{
        resumeId: props.resumeId,
        block: props.ai.block,
        credits: props.ai.credits,
        flush: async () => {},
      }}
    >
      <Workspace {...props} />
    </AiProvider>
  );
}

function Workspace({ resumeId, title }: Props) {
  const ai = useAi()!;
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();
  const [result, setResult] = useState<{
    setId: string;
    analysis: TailorAnalysis;
    ats: AtsResult;
  }>();
  const [job, setJob] = useState({ company: "", position: "", jobDescription: "" });
  const cost = AI_FEATURES.tailor.credits;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <Link href={`/resumes/${resumeId}/edit`} className="text-sm text-primary underline">
        ← Back to “{title}”
      </Link>
      <h1 className="mt-3 text-2xl font-bold">Tailor to a job post</h1>
      <p className="mt-1 text-muted">
        Paste a job post. We&apos;ll show which keywords you already match, what&apos;s missing, and
        suggest clearer wording for your existing experience. The AI never adds experience you
        don&apos;t have, and nothing changes until you accept it.
      </p>

      {ai.block ? (
        <div className="mt-6">
          <AiNotice />
        </div>
      ) : (
        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setError(undefined);
            start(async () => {
              const res = await tailorResume(resumeId, job);
              if (res.ok) {
                setResult(res);
                ai.setCredits(res.creditsLeft);
              } else {
                if (res.code === "consent") ai.setBlock("consent");
                setError(res.message);
              }
            });
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="company" className="block text-sm font-medium">
                Company
              </label>
              <input
                id="company"
                value={job.company}
                maxLength={150}
                onChange={(e) => setJob({ ...job, company: e.target.value })}
                className={inputClass}
                placeholder="e.g., Accenture"
              />
            </div>
            <div>
              <label htmlFor="position" className="block text-sm font-medium">
                Position
              </label>
              <input
                id="position"
                value={job.position}
                maxLength={150}
                onChange={(e) => setJob({ ...job, position: e.target.value })}
                className={inputClass}
                placeholder="e.g., IT Support Associate"
              />
            </div>
          </div>
          <div>
            <label htmlFor="jd" className="block text-sm font-medium">
              Job description
            </label>
            <textarea
              id="jd"
              rows={10}
              required
              minLength={50}
              maxLength={MAX_JOB_DESCRIPTION_CHARS}
              value={job.jobDescription}
              onChange={(e) => setJob({ ...job, jobDescription: e.target.value })}
              className={inputClass}
              placeholder="Paste the whole post from JobStreet, Indeed, LinkedIn or the company site."
            />
            <p className="mt-1 text-right text-xs text-muted">
              {job.jobDescription.length}/{MAX_JOB_DESCRIPTION_CHARS}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className={buttonClass.primary}
              disabled={pending || ai.credits < cost}
            >
              {pending ? "Analysing… (about 20 seconds)" : "Analyse and suggest"}
            </button>
            <span className="text-sm text-muted">
              Uses {cost} AI credits · {ai.credits} left this month
            </span>
          </div>
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
        </form>
      )}

      {result && (
        <Results
          setId={result.setId}
          analysis={result.analysis}
          ats={result.ats}
          resumeId={resumeId}
          onChange={(analysis) => setResult({ ...result, analysis })}
        />
      )}
    </main>
  );
}

function Results({
  setId,
  analysis,
  ats,
  resumeId,
  onChange,
}: {
  setId: string;
  analysis: TailorAnalysis;
  ats: AtsResult;
  resumeId: string;
  onChange: (a: TailorAnalysis) => void;
}) {
  return (
    <section aria-labelledby="results" className="mt-10 space-y-8">
      <h2 id="results" className="text-xl font-bold">
        Results
      </h2>

      {ats.keywords && (
        <p className="text-lg">
          Keyword match: <strong>{ats.keywords.percent}%</strong>
        </p>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <h3 className="font-semibold">Already in your resume</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {analysis.matchedKeywords.map((k) => (
              <li key={k}>
                <span aria-hidden className="text-success">
                  ✓
                </span>{" "}
                <span className="sr-only">Matched: </span>
                {k}
              </li>
            ))}
            {!analysis.matchedKeywords.length && <li className="text-muted">None found.</li>}
          </ul>
        </div>
        <div>
          <h3 className="font-semibold">Missing from your resume</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {analysis.missingKeywords.map((k) => (
              <li key={k}>
                <span aria-hidden className="text-danger">
                  ✗
                </span>{" "}
                <span className="sr-only">Missing: </span>
                {k}
              </li>
            ))}
            {!analysis.missingKeywords.length && <li className="text-muted">Nothing important.</li>}
          </ul>
        </div>
      </div>

      {analysis.gaps.length > 0 && (
        <div className="rounded-lg bg-primary-soft p-4">
          <h3 className="font-semibold">Gaps to think about</h3>
          <p className="text-sm text-muted">
            Add these to your resume only if they&apos;re true for you.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {analysis.gaps.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h3 className="font-semibold">Suggested rewrites</h3>
        {analysis.suggestions.length === 0 && (
          <p className="mt-2 text-sm text-muted">
            No changes suggested — your wording already fits.
          </p>
        )}
        <ul className="mt-3 space-y-4">
          {analysis.suggestions.map((s, i) => (
            <SuggestionCard
              key={s.ref}
              setId={setId}
              index={i}
              analysis={analysis}
              onChange={onChange}
            />
          ))}
        </ul>
        <p className="mt-4 text-sm">
          Accepted changes are saved to your resume.{" "}
          <Link href={`/resumes/${resumeId}/edit`} className="font-medium text-primary underline">
            Open the editor
          </Link>{" "}
          to see them.
        </p>
      </div>

      <div className="rounded-xl border border-border/60 bg-white p-4">
        <h3 className="mb-2 font-semibold">ATS check</h3>
        <AtsChecklist result={ats} />
      </div>
    </section>
  );
}

function SuggestionCard({
  setId,
  index,
  analysis,
  onChange,
}: {
  setId: string;
  index: number;
  analysis: TailorAnalysis;
  onChange: (a: TailorAnalysis) => void;
}) {
  const s = analysis.suggestions[index];
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(s.proposed);
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const max = s.ref === "headline" ? 100 : s.ref.endsWith(":text") ? 1500 : 300;

  const decide = (decision: "apply" | "dismiss", edited?: string) =>
    start(async () => {
      const res = await decideSuggestion(setId, index, decision, edited);
      if (res.ok) {
        onChange(res.analysis);
        setEditing(false);
      } else setError(res.message);
    });

  return (
    <li className="rounded-xl border border-border/60 bg-white p-4">
      <p className="text-sm font-medium text-muted">{s.label}</p>
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase text-muted">Before</p>
          <p className="mt-1 text-sm">{s.original}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-primary">After</p>
          {editing ? (
            <>
              <label htmlFor={`edit-${index}`} className="sr-only">
                Edit suggestion
              </label>
              <textarea
                id={`edit-${index}`}
                rows={3}
                value={text}
                maxLength={max}
                onChange={(e) => setText(e.target.value)}
                className={inputClass}
              />
            </>
          ) : (
            <p className="mt-1 text-sm">{s.proposed}</p>
          )}
        </div>
      </div>
      <p className="mt-2 text-sm text-muted">Why: {s.reason}</p>
      {s.flags.length > 0 && (
        <p className="mt-2 text-sm font-medium text-danger">
          ⚠ This adds details not in your resume ({s.flags.join(", ")}) — confirm it&apos;s true
          before accepting.
        </p>
      )}

      {s.status === "pending" ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {editing ? (
            <button
              type="button"
              className={buttonClass.primary}
              disabled={pending}
              onClick={() => decide("apply", text)}
            >
              Save and accept
            </button>
          ) : (
            <>
              <button
                type="button"
                className={buttonClass.primary}
                disabled={pending}
                onClick={() => decide("apply")}
              >
                Accept
              </button>
              <button
                type="button"
                className={buttonClass.secondary}
                disabled={pending}
                onClick={() => setEditing(true)}
              >
                Edit
              </button>
            </>
          )}
          <button
            type="button"
            className={buttonClass.ghost}
            disabled={pending}
            onClick={() => decide("dismiss")}
          >
            Dismiss
          </button>
        </div>
      ) : (
        <p
          className={`mt-3 text-sm font-medium ${s.status === "applied" ? "text-success" : "text-muted"}`}
        >
          {s.status === "applied" ? "✓ Accepted — saved to your resume" : "Dismissed"}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </li>
  );
}
