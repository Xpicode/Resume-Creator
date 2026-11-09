"use client";

import { useState, useTransition } from "react";
import { buttonClass, inputClass } from "@/components/ui";
import { removePhoto, uploadPhoto } from "@/features/resume/actions";
import {
  CIVIL_STATUSES,
  SEXES,
  type OptionalField,
  type Personal,
  type ResumeSettings,
} from "@/features/resume/schema";

type Props = {
  resumeId: string;
  personal: Personal;
  settings: ResumeSettings;
  hasPhoto: boolean;
  onPersonal: (p: Personal) => void;
  onSettings: (s: ResumeSettings) => void;
  onPhotoChanged: (hasPhoto: boolean) => void;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function PersonalForm({
  resumeId,
  personal,
  settings,
  hasPhoto,
  onPersonal,
  onSettings,
  onPhotoChanged,
}: Props) {
  const set = (key: keyof Personal, value: string) => onPersonal({ ...personal, [key]: value });
  const show = settings.show ?? {};
  const toggle = (key: OptionalField, on: boolean) =>
    onSettings({ ...settings, show: { ...show, [key]: on } });

  const text = (
    key: keyof Personal,
    label: string,
    opts: { max: number; placeholder?: string; type?: string; autoComplete?: string },
  ) => (
    <div>
      <label htmlFor={`p-${key}`} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={`p-${key}`}
        type={opts.type ?? "text"}
        value={(personal[key] as string | undefined) ?? ""}
        maxLength={opts.max}
        placeholder={opts.placeholder}
        autoComplete={opts.autoComplete}
        onChange={(e) => set(key, e.target.value)}
        className={inputClass}
      />
    </div>
  );

  const showToggle = (key: OptionalField) => (
    <label className="mt-1 flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={show[key] === true}
        onChange={(e) => toggle(key, e.target.checked)}
        className="size-4 accent-primary"
      />
      Show on resume
    </label>
  );

  const emailInvalid = Boolean(personal.email) && !EMAIL_RE.test(personal.email ?? "");
  const links = personal.links ?? [];
  const setLink = (i: number, patch: { label?: string; url?: string }) =>
    onPersonal({ ...personal, links: links.map((l, k) => (k === i ? { ...l, ...patch } : l)) });

  return (
    <details id="personal-info" open className="group rounded-xl border border-border/60 bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between p-4 font-semibold">
        Personal information
        <span aria-hidden className="text-muted transition group-open:rotate-180">
          ▾
        </span>
      </summary>
      <div className="space-y-4 border-t border-border/40 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {text("firstName", "First name", {
            max: 60,
            placeholder: "e.g., Juan",
            autoComplete: "given-name",
          })}
          {text("middleName", "Middle name", { max: 60, autoComplete: "additional-name" })}
          {text("lastName", "Last name", {
            max: 60,
            placeholder: "e.g., Dela Cruz",
            autoComplete: "family-name",
          })}
          {text("suffix", "Suffix", { max: 10, placeholder: "e.g., Jr., III" })}
          <div className="sm:col-span-2">
            {text("headline", "Headline", {
              max: 100,
              placeholder: "e.g., Computer Science Graduate",
            })}
          </div>
          <div>
            {text("email", "Email", { max: 254, type: "email", autoComplete: "email" })}
            {emailInvalid && (
              <p className="mt-1 text-sm text-danger">
                This doesn&apos;t look like an email address.
              </p>
            )}
          </div>
          {text("phone", "Mobile number", {
            max: 30,
            type: "tel",
            placeholder: "e.g., 0917 123 4567",
            autoComplete: "tel",
          })}
          <div className="sm:col-span-2">
            {text("cityProvince", "City / province", {
              max: 100,
              placeholder: "e.g., Marikina City, Metro Manila",
            })}
          </div>
        </div>

        <fieldset>
          <legend className="text-sm font-medium">Links (LinkedIn, GitHub, portfolio)</legend>
          {links.map((l, i) => (
            <div key={l.id} className="mt-2 flex flex-wrap items-center gap-2">
              <label className="sr-only" htmlFor={`link-label-${l.id}`}>
                Link {i + 1} label
              </label>
              <input
                id={`link-label-${l.id}`}
                value={l.label ?? ""}
                maxLength={30}
                placeholder="LinkedIn"
                onChange={(e) => setLink(i, { label: e.target.value })}
                className={`${inputClass} mt-0 w-32`}
              />
              <label className="sr-only" htmlFor={`link-url-${l.id}`}>
                Link {i + 1} address
              </label>
              <input
                id={`link-url-${l.id}`}
                type="url"
                value={l.url ?? ""}
                maxLength={300}
                placeholder="https://…"
                onChange={(e) => setLink(i, { url: e.target.value })}
                className={`${inputClass} mt-0 min-w-48 flex-1`}
              />
              <button
                type="button"
                className={`${buttonClass.ghost} text-danger`}
                onClick={() => onPersonal({ ...personal, links: links.filter((_, k) => k !== i) })}
                aria-label={`Remove link ${i + 1}`}
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            className={`${buttonClass.ghost} mt-1`}
            disabled={links.length >= 5}
            onClick={() =>
              onPersonal({
                ...personal,
                links: [...links, { id: crypto.randomUUID(), label: "", url: "" }],
              })
            }
          >
            + Add link
          </button>
        </fieldset>

        <PhotoField
          resumeId={resumeId}
          hasPhoto={hasPhoto}
          onChanged={onPhotoChanged}
          toggle={showToggle("photo")}
        />

        <details className="rounded-lg border border-border/40 p-3">
          <summary className="cursor-pointer font-medium">
            More options (optional PH fields)
          </summary>
          <p className="mt-2 rounded-lg bg-primary-soft p-3 text-sm">
            💡 Most private companies no longer ask for your birthdate, civil status or sex. They
            stay off your resume unless you tick “Show on resume”.
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              {text("fullAddress", "Full address", { max: 200, autoComplete: "street-address" })}
              {showToggle("fullAddress")}
            </div>
            <div>
              {text("birthdate", "Birthdate", { max: 10, type: "date", autoComplete: "bday" })}
              {showToggle("birthdate")}
            </div>
            <div>
              <label htmlFor="p-civilStatus" className="block text-sm font-medium">
                Civil status
              </label>
              <select
                id="p-civilStatus"
                value={personal.civilStatus ?? ""}
                onChange={(e) => set("civilStatus", e.target.value)}
                className={inputClass}
              >
                {CIVIL_STATUSES.map((v) => (
                  <option key={v} value={v}>
                    {v || "—"}
                  </option>
                ))}
              </select>
              {showToggle("civilStatus")}
            </div>
            <div>
              <label htmlFor="p-sex" className="block text-sm font-medium">
                Sex
              </label>
              <select
                id="p-sex"
                value={personal.sex ?? ""}
                onChange={(e) => set("sex", e.target.value)}
                className={inputClass}
              >
                {SEXES.map((v) => (
                  <option key={v} value={v}>
                    {v || "—"}
                  </option>
                ))}
              </select>
              {showToggle("sex")}
            </div>
            <div>
              {text("nationality", "Nationality", { max: 50, placeholder: "e.g., Filipino" })}
              {showToggle("nationality")}
            </div>
          </div>
        </details>
      </div>
    </details>
  );
}

function PhotoField({
  resumeId,
  hasPhoto,
  onChanged,
  toggle,
}: {
  resumeId: string;
  hasPhoto: boolean;
  onChanged: (has: boolean) => void;
  toggle: React.ReactNode;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();
  const [stamp, setStamp] = useState(0);

  return (
    <div className="rounded-lg border border-border/40 p-3">
      <p className="text-sm font-medium">2x2 photo (optional)</p>
      <p className="mt-1 text-sm text-muted">
        Shown only on the PH Traditional template. Most online applications don&apos;t need a photo.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {hasPhoto && (
          // eslint-disable-next-line @next/next/no-img-element -- private, per-user image served with no-store
          <img
            src={`/api/resumes/${resumeId}/photo?v=${stamp}`}
            alt="Your resume photo"
            width={72}
            height={72}
            className="size-18 rounded border border-border/40 object-cover"
          />
        )}
        <label className={`${buttonClass.secondary} cursor-pointer`}>
          {pending ? "Uploading…" : hasPhoto ? "Replace photo" : "Upload photo"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={pending}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              if (file.size > 5 * 1024 * 1024)
                return setError("That photo is over 5 MB. Try a smaller one.");
              const fd = new FormData();
              fd.set("photo", file);
              start(async () => {
                const res = await uploadPhoto(resumeId, fd);
                setError(res.ok ? undefined : res.message);
                if (res.ok) {
                  setStamp(Date.now());
                  onChanged(true);
                }
              });
            }}
          />
        </label>
        {hasPhoto && (
          <button
            type="button"
            className={`${buttonClass.ghost} text-danger`}
            disabled={pending}
            onClick={() =>
              start(async () => {
                const res = await removePhoto(resumeId);
                if (res.ok) onChanged(false);
              })
            }
          >
            Remove photo
          </button>
        )}
      </div>
      <p className="mt-2 text-xs text-muted">
        JPG, PNG or WebP up to 5 MB. We crop it square and remove location data.
      </p>
      {hasPhoto && toggle}
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
