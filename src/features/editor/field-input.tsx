"use client";

import { buttonClass, inputClass } from "@/components/ui";
import type { ItemValue } from "@/features/resume/schema";
import { BULLET_MAX_CHARS, type FieldDef } from "@/features/resume/sections";
import { ImproveBullet } from "./ai-buttons";

/** One form control for a registry field (sections.ts). */
export function FieldInput({
  id,
  itemId,
  field,
  value,
  onChange,
}: {
  id: string;
  /** Enables "✨ Improve with AI" on bullets. */
  itemId?: string;
  field: FieldDef;
  value: ItemValue;
  onChange: (v: ItemValue) => void;
}) {
  const hintId = field.hint ? `${id}-hint` : undefined;
  const hint = field.hint && (
    <p id={hintId} className="mt-1 text-sm text-muted">
      {field.hint}
    </p>
  );

  if (field.kind === "checkbox") {
    return (
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="checkbox"
          checked={value === true}
          onChange={(e) => onChange(e.target.checked)}
          className="size-5 accent-primary"
        />
        <label htmlFor={id}>{field.label}</label>
      </div>
    );
  }

  if (field.kind === "bullets") {
    return (
      <BulletsInput
        id={id}
        itemId={itemId}
        field={field}
        value={Array.isArray(value) ? value : []}
        onChange={onChange}
      />
    );
  }

  const text = typeof value === "string" || typeof value === "number" ? String(value) : "";
  return (
    <div className={field.kind === "textarea" ? "sm:col-span-2" : undefined}>
      <label htmlFor={id} className="block text-sm font-medium">
        {field.label}
      </label>
      {field.kind === "textarea" ? (
        <>
          <textarea
            id={id}
            rows={4}
            value={text}
            maxLength={field.max}
            placeholder={field.placeholder}
            aria-describedby={hintId}
            onChange={(e) => onChange(e.target.value)}
            className={inputClass}
          />
          <p className="mt-1 text-right text-xs text-muted">
            {text.length}/{field.max}
          </p>
        </>
      ) : (
        <input
          id={id}
          type={
            field.kind === "month"
              ? "month"
              : field.kind === "number"
                ? "number"
                : field.kind === "url"
                  ? "url"
                  : "text"
          }
          inputMode={field.kind === "number" ? "numeric" : undefined}
          min={field.kind === "number" ? 0 : undefined}
          max={field.kind === "number" ? 10000 : undefined}
          value={text}
          maxLength={field.kind === "number" ? undefined : field.max}
          placeholder={field.placeholder}
          aria-describedby={hintId}
          onChange={(e) => {
            if (field.kind !== "number") return onChange(e.target.value);
            const n = Number.parseInt(e.target.value, 10);
            onChange(Number.isFinite(n) ? Math.min(10000, Math.max(0, n)) : undefined);
          }}
          className={inputClass}
        />
      )}
      {hint}
    </div>
  );
}

function BulletsInput({
  id,
  itemId,
  field,
  value,
  onChange,
}: {
  id: string;
  itemId?: string;
  field: FieldDef;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const max = field.max ?? 8;
  // An item with no bullets yet still shows one empty box; edits go to `list`, not `value`.
  const list = value.length ? value : [""];
  const set = (i: number, text: string) => onChange(list.map((b, k) => (k === i ? text : b)));
  const move = (i: number, d: -1 | 1) => {
    const next = [...list];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
  };

  return (
    <fieldset className="sm:col-span-2">
      <legend className="text-sm font-medium">{field.label}</legend>
      <ul className="mt-1 space-y-2">
        {list.map((b, i) => (
          <li key={i}>
            <div className="flex items-start gap-1">
              <span aria-hidden className="pt-3">
                •
              </span>
              <label htmlFor={`${id}-${i}`} className="sr-only">
                {field.label} {i + 1}
              </label>
              <textarea
                id={`${id}-${i}`}
                rows={2}
                value={b}
                maxLength={BULLET_MAX_CHARS}
                placeholder={i === 0 ? field.placeholder : undefined}
                onChange={(e) => set(i, e.target.value)}
                className={`${inputClass} mt-0`}
              />
              <div className="flex flex-col">
                <button
                  type="button"
                  className={buttonClass.ghost}
                  disabled={i === 0}
                  onClick={() => move(i, -1)}
                  aria-label={`Move bullet ${i + 1} up`}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className={buttonClass.ghost}
                  disabled={i === list.length - 1}
                  onClick={() => move(i, 1)}
                  aria-label={`Move bullet ${i + 1} down`}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className={`${buttonClass.ghost} text-danger`}
                  onClick={() => onChange(list.filter((_, k) => k !== i))}
                  aria-label={`Remove bullet ${i + 1}`}
                >
                  ×
                </button>
              </div>
            </div>
            {itemId && (
              <ImproveBullet
                itemId={itemId}
                index={i}
                disabled={!b.trim()}
                onUse={(t) => set(i, t)}
              />
            )}
          </li>
        ))}
      </ul>
      <button
        type="button"
        className={`${buttonClass.ghost} mt-1`}
        disabled={list.length >= max}
        onClick={() => onChange([...list, ""])}
      >
        + Add bullet
      </button>
    </fieldset>
  );
}
