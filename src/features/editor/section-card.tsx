"use client";

import { buttonClass, inputClass } from "@/components/ui";
import { emptyItem, type ResumeItem, type ResumeSection } from "@/features/resume/schema";
import { SECTIONS } from "@/features/resume/sections";
import { WriteSummary } from "./ai-buttons";
import { FieldInput } from "./field-input";

type Props = {
  section: ResumeSection;
  index: number;
  count: number;
  open: boolean;
  onChange: (next: ResumeSection) => void;
  onMove: (d: -1 | 1) => void;
  onRemove: () => void;
};

function swap<T>(list: T[], i: number, d: -1 | 1): T[] {
  const next = [...list];
  [next[i], next[i + d]] = [next[i + d], next[i]];
  return next;
}

/** One section: rename, show/hide, ↑/↓ reorder (no drag-and-drop in v1, plan 5.7), items. */
export function SectionCard({ section, index, count, open, onChange, onMove, onRemove }: Props) {
  const def = SECTIONS[section.type];
  const setItem = (i: number, item: ResumeItem) =>
    onChange({ ...section, items: section.items.map((it, k) => (k === i ? item : it)) });
  const titleId = `${section.id}-title`;
  const hiddenByReferences = section.type === "references" && section.availableUponRequest;

  return (
    <details
      id={`section-${section.id}`}
      open={open}
      className="group rounded-xl border border-border/60 bg-white"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 p-4 font-semibold">
        <span>
          {section.title || def.defaultTitle}
          {!section.isVisible && (
            <span className="ml-2 text-sm font-normal text-muted">(hidden)</span>
          )}
        </span>
        <span aria-hidden className="text-muted transition group-open:rotate-180">
          ▾
        </span>
      </summary>

      <div className="space-y-4 border-t border-border/40 p-4">
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-48 flex-1">
            <label htmlFor={titleId} className="block text-sm font-medium">
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
          <button
            type="button"
            className={buttonClass.ghost}
            disabled={index === 0}
            onClick={() => onMove(-1)}
            aria-label={`Move ${section.title || def.label} up`}
          >
            ↑ Up
          </button>
          <button
            type="button"
            className={buttonClass.ghost}
            disabled={index === count - 1}
            onClick={() => onMove(1)}
            aria-label={`Move ${section.title || def.label} down`}
          >
            ↓ Down
          </button>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={section.isVisible}
              onChange={(e) => onChange({ ...section, isVisible: e.target.checked })}
              className="size-5 accent-primary"
            />
            Show on resume
          </label>
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
        </div>

        {def.tip && <p className="rounded-lg bg-primary-soft p-3 text-sm">💡 {def.tip}</p>}
        {section.type === "summary" && section.items[0] && (
          <WriteSummary onUse={(text) => setItem(0, { ...section.items[0], text })} />
        )}

        {!hiddenByReferences && (
          <>
            {section.items.map((item, i) => (
              <fieldset key={item.id} className="rounded-lg border border-border/40 p-3">
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
                {def.maxItems > 1 && (
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
                className={buttonClass.secondary}
                disabled={section.items.length >= def.maxItems}
                onClick={() => onChange({ ...section, items: [...section.items, emptyItem()] })}
              >
                + Add {def.label.toLowerCase()}
              </button>
            )}
          </>
        )}

        <div className="border-t border-border/40 pt-3">
          <button
            type="button"
            className={`${buttonClass.ghost} text-danger`}
            onClick={() => {
              if (
                window.confirm(
                  `Remove the "${section.title || def.label}" section and everything in it?`,
                )
              )
                onRemove();
            }}
          >
            Remove section
          </button>
        </div>
      </div>
    </details>
  );
}
