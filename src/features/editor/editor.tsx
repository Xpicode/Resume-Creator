"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { buttonClass, inputClass } from "@/components/ui";
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
import { SectionCard } from "./section-card";
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
  const [addType, setAddType] = useState<SectionType>("custom");
  const [now, setNow] = useState(() => Date.now());
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
  const setSections = (next: ResumeSection[]) =>
    setDoc((d) => ({ ...d, content: { ...d.content, sections: next } }));
  const moveSection = (i: number, dir: -1 | 1) => {
    const next = [...sections];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    setSections(next);
  };

  const statusLine = (
    <p
      role="status"
      aria-live="polite"
      className={`text-sm ${status.kind === "error" || status.kind === "conflict" || status.kind === "offline" ? "font-medium text-danger" : "text-muted"}`}
    >
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
      <AtsPanel resumeId={resumeId} flush={flush} />
      <PersonalForm
        resumeId={resumeId}
        personal={doc.content.personal}
        settings={doc.settings}
        hasPhoto={hasPhoto}
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
          open={i === 0}
          onChange={(next) => setSections(sections.map((s) => (s.id === next.id ? next : s)))}
          onMove={(d) => moveSection(i, d)}
          onRemove={() => setSections(sections.filter((s) => s.id !== section.id))}
        />
      ))}

      <div className="flex flex-wrap items-end gap-2 rounded-xl border border-dashed border-border p-4">
        <div className="min-w-48 flex-1">
          <label htmlFor="add-section" className="block text-sm font-medium">
            Add a section
          </label>
          <select
            id="add-section"
            value={addType}
            onChange={(e) => setAddType(e.target.value as SectionType)}
            className={inputClass}
          >
            {SECTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {SECTIONS[t].label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className={buttonClass.secondary}
          disabled={sections.length >= 25}
          onClick={() => setSections([...sections, newSection(addType)])}
        >
          + Add
        </button>
      </div>
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
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-28 pt-6 lg:pb-10">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-56 flex-1">
            <label htmlFor="resume-title" className="block text-sm font-medium">
              Resume name (only you see this)
            </label>
            <input
              id="resume-title"
              value={doc.title}
              maxLength={100}
              onChange={(e) => setDoc((d) => ({ ...d, title: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="template" className="block text-sm font-medium">
              Template
            </label>
            <select
              id="template"
              value={doc.templateSlug}
              onChange={(e) =>
                setDoc((d) => ({ ...d, templateSlug: e.target.value as TemplateSlug }))
              }
              className={inputClass}
            >
              {TEMPLATE_OPTIONS.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <Link href={`/resumes/${resumeId}/tailor`} className={buttonClass.secondary}>
            ✨ Tailor to a job
          </Link>
          <Link href={`/resumes/${resumeId}/share`} className={buttonClass.secondary}>
            Share link
          </Link>
          {isDesktop && downloadDialog}
        </div>
        <div className="mt-2 hidden lg:block">{statusLine}</div>

        {/* Mobile: Edit | Preview tabs (plan 5.4) */}
        <div
          role="tablist"
          aria-label="Editor view"
          className="mt-4 grid grid-cols-2 rounded-lg bg-primary-soft p-1 lg:hidden"
        >
          {(["edit", "preview"] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-md py-2 font-medium ${tab === t ? "bg-white shadow-sm" : "text-muted"}`}
            >
              {t === "edit" ? "Edit" : "Preview"}
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
        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border/40 bg-white px-4 py-3 lg:hidden">
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
