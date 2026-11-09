"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { buttonClass, inputClass } from "@/components/ui";
import type { PaperSize, ResumeSettings, TemplateSlug } from "@/features/resume/schema";
import type { Personal } from "@/features/resume/schema";
import { pdfFileName } from "@/features/resume/view";
import { TEMPLATE_OPTIONS } from "./templates";

type Props = {
  resumeId: string;
  personal: Personal;
  settings: ResumeSettings;
  templateSlug: TemplateSlug;
  paperSize: PaperSize;
  isGuest: boolean;
  onTemplate: (t: TemplateSlug) => void;
  onPaper: (p: PaperSize) => void;
  flush: () => Promise<void>;
};

const OPTIONAL_LABELS: Record<string, string> = {
  fullAddress: "full address",
  birthdate: "birthdate",
  civilStatus: "civil status",
  sex: "sex",
  nationality: "nationality",
  photo: "photo",
};

/** Download dialog (plan 5.4). Native <dialog>: focus trap, Esc to close, no library. */
export function DownloadDialog(props: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [downloaded, setDownloaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const shown = Object.entries(props.settings.show ?? {})
    .filter(([k, on]) => on && (k !== "photo" || props.templateSlug === "ph-traditional"))
    .map(([k]) => OPTIONAL_LABELS[k]);

  async function download() {
    setBusy(true);
    await props.flush(); // the PDF is rendered from what's saved
    // A plain link click: the response is a file download (Content-Disposition), not a page.
    const link = document.createElement("a");
    link.href = `/api/resumes/${props.resumeId}/pdf`;
    link.click();
    setBusy(false);
    setDownloaded(true);
  }

  return (
    <>
      <button
        type="button"
        className={buttonClass.primary}
        onClick={() => ref.current?.showModal()}
      >
        Download PDF
      </button>
      <dialog
        ref={ref}
        aria-labelledby="download-title"
        className="m-auto w-[min(32rem,calc(100%-2rem))] rounded-xl p-0 backdrop:bg-black/40"
      >
        <div className="space-y-4 p-5">
          <h2 id="download-title" className="text-xl font-bold">
            Download your resume
          </h2>

          <div>
            <label htmlFor="dl-template" className="block text-sm font-medium">
              Template
            </label>
            <select
              id="dl-template"
              value={props.templateSlug}
              onChange={(e) => props.onTemplate(e.target.value as TemplateSlug)}
              className={inputClass}
            >
              {TEMPLATE_OPTIONS.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.name} — {t.use}
                </option>
              ))}
            </select>
          </div>

          <fieldset>
            <legend className="text-sm font-medium">Paper size</legend>
            <div className="mt-1 flex gap-4">
              {(["A4", "LETTER"] as const).map((p) => (
                <label key={p} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="paper"
                    checked={props.paperSize === p}
                    onChange={() => props.onPaper(p)}
                    className="size-4 accent-primary"
                  />
                  {p === "A4" ? "A4" : "Letter (short bond)"}
                </label>
              ))}
            </div>
          </fieldset>

          <p className="text-sm">
            File name:{" "}
            <code className="rounded bg-primary-soft px-1">{pdfFileName(props.personal)}</code>
          </p>

          {shown.length > 0 && (
            <p className="rounded-lg bg-primary-soft p-3 text-sm">
              Your resume shows your {shown.join(", ")}. Most private employers don&apos;t need
              these — you can hide them under Personal information → More options.
            </p>
          )}

          {downloaded && props.isGuest && (
            <p className="rounded-lg border border-primary p-3 text-sm">
              <strong>Keep your resume:</strong>{" "}
              <Link href="/signup" className="font-medium text-primary underline">
                create a free account
              </Link>{" "}
              so you can edit it later. Guest resumes are deleted after 30 days without use.
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              className={buttonClass.secondary}
              onClick={() => ref.current?.close()}
            >
              Close
            </button>
            <button
              type="button"
              className={buttonClass.primary}
              disabled={busy}
              onClick={download}
            >
              {busy ? "Preparing…" : "Download"}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
