"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { buttonClass } from "@/components/ui";
import {
  newSection,
  type ResumeSection,
  type SaveResumeInput,
  type TemplateSlug,
} from "@/features/resume/schema";
import { SECTION_TYPES, SECTIONS, type SectionType } from "@/features/resume/sections";
import type { AiBlock } from "@/features/ai/guard";
import { AiProvider } from "./ai";
import { AtsPanel } from "./ats-panel";
import { DownloadDialog } from "./download-dialog";
import { PersonalForm } from "./personal-form";
import { PreviewPane } from "./preview-pane";
import { nextStep, PERSONAL_STEP, resumeProgress, SECTION_ICONS } from "./progress";
import { SectionCard } from "./section-card";
import { StepsBar } from "./steps-bar";
import { TEMPLATE_OPTIONS } from "./templates";
import { useAutosave, type SaveStatus } from "./use-autosave";

type Props = {
  resumeId: string;
  initial: SaveResumeInput;
  updatedAt: string;
  hasPhoto: boolean;
  isGuest: boolean;
  ai: { block: AiBlock | null; credits: number };
};

function statusText(s: SaveStatus, now: number): string {
  switch (s.kind) {
    case "saved":
      if (s.at === 0) return "All changes saved";
      return now - s.at < 60_000
        ? "Saved · just now"
        : `Saved · ${new Date(s.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
    case "pending":
      return "Unsaved changes…";
    case "saving":
      return "Saving…";
    case "offline":
      return "You're offline — we'll save when you reconnect";
    case "conflict":
      return "Changed in another tab";
    case "error":
      return s.message;
  }
}

const elementIdFor = (stepId: string) =>
  stepId === PERSONAL_STEP ? "personal-info" : `section-${stepId}`;

export function Editor({
  resumeId,
  initial,
  updatedAt,
  hasPhoto: initialHasPhoto,
  isGuest,
  ai,
}: Props) {
  const [doc, setDoc] = useState<SaveResumeInput>(initial);
  const [hasPhoto, setHasPhoto] = useState(initialHasPhoto);
  const [photoStamp, setPhotoStamp] = useState(0);
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [isDesktop, setIsDesktop] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  // Guided editing: one section open at a time, starting with the first unfinished one.
  const [openId, setOpenId] = useState<string | null>(
    () => resumeProgress(initial.content).steps.find((s) => !s.done && !s.hidden)?.id ?? null,
  );
  const { status, version, flush } = useAutosave(resumeId, doc, updatedAt);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    const tick = setInterval(() => setNow(Date.now()), 30_000);
    return () => {
      mq.removeEventListener("change", sync);
      clearInterval(tick);
    };
  }, []);

  const sections = doc.content.sections;
  const { steps, percent } = resumeProgress(doc.content);
  const setSections = (next: ResumeSection[]) =>
    setDoc((d) => ({ ...d, content: { ...d.content, sections: next } }));
  const moveSection = (i: number, dir: -1 | 1) => {
    const next = [...sections];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    setSections(next);
  };

  /** Open a step and bring it into view (after React has opened it). */
  const goTo = (id: string) => {
    setOpenId(id);
    setTab("edit");
    setTimeout(() => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      document
        .getElementById(elementIdFor(id))
        ?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }, 60);
  };
  const toggle = (id: string) => (isOpen: boolean) =>
    setOpenId((cur) => (isOpen ? id : cur === id ? null : cur));
  const finish = () => {
    setOpenId(null);
    setTab("preview");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const nextFor = (id: string) => {
    const n = nextStep(steps, id);
    return n
      ? { label: `Next: ${n.label} →`, onClick: () => goTo(n.id) }
      : { label: "Done — see my resume ✓", onClick: finish };
  };
  const addSection = (type: SectionType) => {
    const s = newSection(type);
    setSections([...sections, s]);
    goTo(s.id);
  };
  const present = new Set(sections.map((s) => s.type));
  const suggestions = SECTION_TYPES.filter((t) => t === "custom" || !present.has(t));

  const statusLine = (
    <p
      role="status"
      aria-live="polite"
      className={`text-sm ${status.kind === "error" || status.kind === "conflict" || status.kind === "offline" ? "font-medium text-danger" : "text-muted"}`}
    >
      {status.kind === "saved" && (
        <span aria-hidden="true" className="mr-1 text-emerald-600">
          ✓
        </span>
      )}
      {statusText(status, now)}
      {status.kind === "conflict" && (
        <>
          {" "}
          —{" "}
          <button type="button" className="underline" onClick={() => window.location.reload()}>
            reload to see the latest version
          </button>
        </>
      )}
    </p>
  );

  const editPanel = (
    <div className="space-y-4">
      <StepsBar steps={steps} percent={percent} openId={openId} onOpen={goTo} />

      {percent >= 80 && (
        <div className="ready-banner flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <span aria-hidden="true" className="text-2xl">
            🎉
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-emerald-900">
              {percent === 100 ? "Your resume is complete!" : "Your resume is almost ready!"}
            </p>
            <p className="text-sm text-emerald-900/80">
              Download the PDF, or tailor it to a job post first for a better match.
            </p>
          </div>
          <Link href={`/resumes/${resumeId}/tailor`} className={buttonClass.secondary}>
            ✨ Tailor to a job
          </Link>
        </div>
      )}

      <PersonalForm
        resumeId={resumeId}
        personal={doc.content.personal}
        settings={doc.settings}
        hasPhoto={hasPhoto}
        open={openId === PERSONAL_STEP}
        onToggle={toggle(PERSONAL_STEP)}
        next={nextFor(PERSONAL_STEP)}
        onPersonal={(personal) => setDoc((d) => ({ ...d, content: { ...d.content, personal } }))}
        onSettings={(settings) => setDoc((d) => ({ ...d, settings }))}
        onPhotoChanged={(has) => {
          setHasPhoto(has);
          setPhotoStamp(Date.now());
          if (has && !doc.settings.show?.photo) {
            setDoc((d) => ({
              ...d,
              settings: { ...d.settings, show: { ...d.settings.show, photo: true } },
            }));
          }
        }}
      />

      {sections.map((section, i) => (
        <SectionCard
          key={section.id}
          section={section}
          index={i}
          count={sections.length}
          open={openId === section.id}
          onToggle={toggle(section.id)}
          next={nextFor(section.id)}
          onChange={(next) => setSections(sections.map((s) => (s.id === next.id ? next : s)))}
          onMove={(d) => moveSection(i, d)}
          onRemove={() => setSections(sections.filter((s) => s.id !== section.id))}
        />
      ))}

      <section
        aria-labelledby="add-section-heading"
        className="rounded-2xl border border-dashed border-border/70 p-4"
      >
        <h2 id="add-section-heading" className="font-semibold">
          Add a section
        </h2>
        <p className="mt-0.5 text-sm text-muted">Only add what helps for the job you want.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {suggestions.map((t) => (
            <button
              key={t}
              type="button"
              disabled={sections.length >= 25}
              onClick={() => addSection(t)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-white px-3 py-1.5 text-sm font-medium transition hover:-translate-y-0.5 hover:border-primary/60 hover:text-primary active:scale-[0.97] disabled:opacity-50 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              <span aria-hidden="true">{SECTION_ICONS[t]}</span>+ {SECTIONS[t].label}
            </button>
          ))}
        </div>
      </section>

      <AtsPanel resumeId={resumeId} flush={flush} />
    </div>
  );

  // One dialog in the DOM at a time (desktop toolbar or mobile bar), so ids stay unique.
  const downloadDialog = (
    <DownloadDialog
      resumeId={resumeId}
      personal={doc.content.personal}
      settings={doc.settings}
      templateSlug={doc.templateSlug}
      paperSize={doc.paperSize}
      isGuest={isGuest}
      onTemplate={(templateSlug) => setDoc((d) => ({ ...d, templateSlug }))}
      onPaper={(paperSize) => setDoc((d) => ({ ...d, paperSize }))}
      flush={flush}
    />
  );

  // The preview refreshes when a save lands, or when the photo changes (stored outside the document).
  const previewVersion = `${version}-${photoStamp}`;

  return (
    <AiProvider value={{ resumeId, block: ai.block, credits: ai.credits, flush }}>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-5 pb-28 lg:pb-10">
        {/* Toolbar: name · template · tailor/share · download */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
          <div className="min-w-0 flex-1 basis-full sm:basis-72">
            <label htmlFor="resume-title" className="sr-only">
              Resume name (only you see this)
            </label>
            <input
              id="resume-title"
              value={doc.title}
              maxLength={100}
              onChange={(e) => setDoc((d) => ({ ...d, title: e.target.value }))}
              className="w-full rounded-lg border border-transparent bg-transparent px-2 py-1 font-[family-name:var(--font-bricolage)] text-2xl font-bold hover:border-border/50 focus:border-primary focus:bg-white"
            />
            <p className="px-2 text-xs text-muted">Resume name — only you see this</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:flex-none">
            <label htmlFor="template" className="sr-only">
              Template
            </label>
            <select
              id="template"
              value={doc.templateSlug}
              onChange={(e) =>
                setDoc((d) => ({ ...d, templateSlug: e.target.value as TemplateSlug }))
              }
              className="rounded-lg border border-border bg-white px-3 py-2 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {TEMPLATE_OPTIONS.map((t) => (
                <option key={t.slug} value={t.slug}>
                  Template: {t.name}
                </option>
              ))}
            </select>
            <Link
              href={`/resumes/${resumeId}/tailor`}
              className={`${buttonClass.secondary} py-2 text-sm`}
            >
              ✨ Tailor
            </Link>
            <Link
              href={`/resumes/${resumeId}/share`}
              className={`${buttonClass.secondary} py-2 text-sm`}
            >
              Share
            </Link>
            {isDesktop && downloadDialog}
          </div>
        </div>
        <div className="mt-1 hidden px-2 lg:block">{statusLine}</div>

        {/* Mobile: Edit | Preview tabs (plan 5.4) */}
        <div
          role="tablist"
          aria-label="Editor view"
          className="mt-4 grid grid-cols-2 rounded-xl bg-primary-soft p-1 lg:hidden"
        >
          {(["edit", "preview"] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-lg py-2 font-medium transition ${tab === t ? "bg-white shadow-sm" : "text-muted"}`}
            >
              {t === "edit" ? "✏️ Edit" : "👁 Preview"}
            </button>
          ))}
        </div>

        <div className="mt-4 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-6">
          <div className={tab === "edit" ? "" : "hidden lg:block"}>{editPanel}</div>
          <div className={tab === "preview" ? "" : "hidden lg:block"}>
            <div className="lg:sticky lg:top-4">
              <PreviewPane
                resumeId={resumeId}
                version={previewVersion}
                active={isDesktop || tab === "preview"}
              />
            </div>
          </div>
        </div>

        {/* Mobile sticky bar: save status · preview · download */}
        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border/40 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-7xl items-center gap-3">
            <div className="min-w-0 flex-1">{statusLine}</div>
            <button
              type="button"
              className={buttonClass.ghost}
              onClick={() => setTab(tab === "edit" ? "preview" : "edit")}
            >
              {tab === "edit" ? "Preview" : "Edit"}
            </button>
            {!isDesktop && downloadDialog}
          </div>
        </div>
      </main>
    </AiProvider>
  );
}
