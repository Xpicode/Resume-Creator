"use client";

import { buttonClass, inputClass } from "@/components/ui";
import { emptyItem, type ResumeItem, type ResumeSection } from "@/features/resume/schema";
import { SECTIONS } from "@/features/resume/sections";
import { WriteSummary } from "./ai-buttons";
import { FieldInput } from "./field-input";
import { SECTION_ICONS, sectionDone } from "./progress";

type Props = {
  section: ResumeSection;
  index: number;
  count: number;
  open: boolean;
  onToggle: (open: boolean) => void;
  next: { label: string; onClick: () => void };
  onChange: (next: ResumeSection) => void;
  onMove: (d: -1 | 1) => void;
  onRemove: () => void;
};

function swap<T>(list: T[], i: number, d: -1 | 1): T[] {
  const next = [...list];
  [next[i], next[i + d]] = [next[i + d], next[i]];
  return next;
}

/** Status shown on a closed card, so you can see at a glance what's left. */
export function StepStatus({ done, hidden }: { done: boolean; hidden?: boolean }) {
  if (hidden) return <span className="text-xs font-medium text-muted">Hidden</span>;
  return done ? (
    <span className="step-check rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
      ✓ Done
    </span>
  ) : (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-muted">
      To fill in
    </span>
  );
}

/**
 * One section of the guided editor. Content first (tip, AI, items); renaming, reordering (↑/↓, no
 * drag-and-drop in v1 — plan 5.7), hiding and removing live under "Section options".
 */
export function SectionCard({
  section,
  index,
  count,
  open,
  onToggle,
  next,
  onChange,
  onMove,
  onRemove,
}: Props) {
  const def = SECTIONS[section.type];
  const setItem = (i: number, item: ResumeItem) =>
    onChange({ ...section, items: section.items.map((it, k) => (k === i ? item : it)) });
  const titleId = `${section.id}-title`;
  const hiddenByReferences = section.type === "references" && section.availableUponRequest;
  const name = section.title || def.defaultTitle;

  return (
    <details
      id={`section-${section.id}`}
      open={open}
      onToggle={(e) => onToggle(e.currentTarget.open)}
      className="group scroll-mt-24 rounded-2xl border border-border/50 bg-white transition-shadow open:border-primary/40 open:shadow-[0_14px_36px_-26px_rgb(30_58_138/0.7)]"
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 p-4">
        <span
          aria-hidden="true"
          className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-lg"
        >
          {SECTION_ICONS[section.type]}
        </span>
        <span className="min-w-0 flex-1 font-[family-name:var(--font-bricolage)] text-lg font-bold">
          {name}
        </span>
        <StepStatus done={sectionDone(section)} hidden={!section.isVisible} />
        <span aria-hidden className="text-muted transition group-open:rotate-180">
          ▾
        </span>
      </summary>

      <div className="card-body space-y-4 border-t border-border/40 p-4">
        {def.tip && (
          <p className="flex gap-2 rounded-xl bg-primary-soft p-3 text-sm">
            <span aria-hidden="true">💡</span>
            <span>{def.tip}</span>
          </p>
        )}
        {section.type === "summary" && section.items[0] && (
          <WriteSummary onUse={(text) => setItem(0, { ...section.items[0], text })} />
        )}
        {section.type === "references" && (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={section.availableUponRequest === true}
              onChange={(e) => onChange({ ...section, availableUponRequest: e.target.checked })}
              className="size-5 accent-primary"
            />
            Just write “Available upon request”
          </label>
        )}

        {!hiddenByReferences && (
          <>
            {section.items.map((item, i) => (
              <fieldset key={item.id} className="rounded-xl border border-border/40 p-3">
                <legend className="px-1 text-sm font-medium text-muted">
                  {def.maxItems > 1 ? `${def.label} ${i + 1}` : def.label}
                </legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {def.fields.map((f) => (
                    <FieldInput
                      key={f.name}
                      id={`${item.id}-${f.name}`}
                      itemId={item.id}
                      field={f}
                      value={item[f.name]}
                      onChange={(v) => setItem(i, { ...item, [f.name]: v })}
                    />
                  ))}
                </div>
                {def.maxItems > 1 && section.items.length > 1 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    <button
                      type="button"
                      className={buttonClass.ghost}
                      disabled={i === 0}
                      onClick={() => onChange({ ...section, items: swap(section.items, i, -1) })}
                    >
                      ↑ Move up
                    </button>
                    <button
                      type="button"
                      className={buttonClass.ghost}
                      disabled={i === section.items.length - 1}
                      onClick={() => onChange({ ...section, items: swap(section.items, i, 1) })}
                    >
                      ↓ Move down
                    </button>
                    <button
                      type="button"
                      className={`${buttonClass.ghost} text-danger`}
                      onClick={() =>
                        onChange({ ...section, items: section.items.filter((_, k) => k !== i) })
                      }
                    >
                      Remove
                    </button>
                  </div>
                )}
              </fieldset>
            ))}
            {def.maxItems > 1 && (
              <button
                type="button"
                className={`${buttonClass.secondary} w-full border-dashed sm:w-auto`}
                disabled={section.items.length >= def.maxItems}
                onClick={() => onChange({ ...section, items: [...section.items, emptyItem()] })}
              >
                + Add another {def.label.toLowerCase()}
              </button>
            )}
          </>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/40 pt-4">
          <details className="text-sm">
            <summary className="cursor-pointer font-medium text-muted">⚙ Section options</summary>
            <div className="mt-3 space-y-3">
              <div>
                <label htmlFor={titleId} className="block font-medium">
                  Section title
                </label>
                <input
                  id={titleId}
                  value={section.title}
                  maxLength={60}
                  placeholder={def.defaultTitle}
                  onChange={(e) => onChange({ ...section, title: e.target.value })}
                  className={inputClass}
                />
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={section.isVisible}
                  onChange={(e) => onChange({ ...section, isVisible: e.target.checked })}
                  className="size-5 accent-primary"
                />
                Show on resume
              </label>
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  className={buttonClass.ghost}
                  disabled={index === 0}
                  onClick={() => onMove(-1)}
                  aria-label={`Move ${name} up`}
                >
                  ↑ Move section up
                </button>
                <button
                  type="button"
                  className={buttonClass.ghost}
                  disabled={index === count - 1}
                  onClick={() => onMove(1)}
                  aria-label={`Move ${name} down`}
                >
                  ↓ Move section down
                </button>
                <button
                  type="button"
                  className={`${buttonClass.ghost} text-danger`}
                  onClick={() => {
                    if (window.confirm(`Remove the "${name}" section and everything in it?`))
                      onRemove();
                  }}
                >
                  Remove section
                </button>
              </div>
            </div>
          </details>
          <button type="button" className={`${buttonClass.primary} ml-auto`} onClick={next.onClick}>
            {next.label}
          </button>
        </div>
      </div>
    </details>
  );
}
