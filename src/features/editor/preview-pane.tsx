"use client";

import { useEffect, useState } from "react";

/**
 * Live preview: the server renders the same PDF as the download and returns one image of all pages
 * (Phase 0 decision — no PDF library in the browser). Refreshes shortly after each successful save.
 */
export function PreviewPane({
  resumeId,
  version,
  active,
}: {
  resumeId: string;
  version: string;
  active: boolean;
}) {
  const [src, setSrc] = useState<string>();
  const [pages, setPages] = useState(0);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setState("loading");
      try {
        const res = await fetch(
          `/api/resumes/${resumeId}/preview?v=${encodeURIComponent(version)}`,
          {
            signal: controller.signal,
            cache: "no-store",
          },
        );
        if (!res.ok) throw new Error(String(res.status));
        const url = URL.createObjectURL(await res.blob());
        setPages(Number(res.headers.get("x-page-count") ?? 0));
        setSrc((old) => {
          if (old) URL.revokeObjectURL(old);
          return url;
        });
        setState("ready");
      } catch (e) {
        if (!controller.signal.aborted) setState("error");
        void e;
      }
    }, 600);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [resumeId, version, active]);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium">Preview</span>
        <span aria-live="polite" className={pages > 2 ? "font-medium text-danger" : "text-muted"}>
          {state === "loading" && "Updating…"}
          {state === "error" && "Preview unavailable — your work is still saved."}
          {state === "ready" &&
            (pages > 2
              ? `${pages} pages — try to keep it to 2 or fewer`
              : `${pages} page${pages === 1 ? "" : "s"}${pages === 1 ? " · great for fresh grads" : ""}`)}
        </span>
      </div>
      <div className="overflow-hidden rounded-lg border border-border/60 bg-slate-200">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element -- blob URL of a private, per-user render
          <img
            src={src}
            alt="Preview of your resume"
            className={`w-full transition ${state === "loading" ? "opacity-60" : ""}`}
          />
        ) : (
          <div className="flex aspect-[1/1.414] items-center justify-center text-muted">
            Loading preview…
          </div>
        )}
      </div>
    </div>
  );
}
