"use client";
// THROWAWAY Phase 0 spike. Measures, per option: total time from tap to visible page, bytes downloaded, server render time.

import { useRef, useState } from "react";

type Result = { option: string; totalMs: number; serverMs: string | null; downloadedKb: number };

function kbDownloadedSince(t0: number): number {
  const entries = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
  const bytes = entries
    .filter((e) => e.startTime >= t0)
    .reduce((sum, e) => sum + (e.transferSize || e.encodedBodySize), 0);
  return Math.round(bytes / 1024);
}

export function PreviewSpike() {
  const [results, setResults] = useState<Result[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  async function measure(option: string, run: () => Promise<string | null>) {
    setBusy(true);
    setError(undefined);
    performance.clearResourceTimings();
    const t0 = performance.now();
    try {
      const serverMs = await run();
      const totalMs = Math.round(performance.now() - t0);
      setResults((r) => [...r, { option, totalMs, serverMs, downloadedKb: kbDownloadedSince(t0) }]);
    } catch (e) {
      setError(`${option} failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  }

  async function showImage(format: "png" | "webp") {
    const res = await fetch(`/spike/preview/image?format=${format}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const url = URL.createObjectURL(await res.blob());
    const img = imgRef.current!;
    img.src = url;
    await img.decode();
    return res.headers.get("x-render-ms");
  }

  async function showPdfJs() {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url,
    ).toString();

    const res = await fetch("/spike/preview/pdf", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = new Uint8Array(await res.arrayBuffer());
    const task = pdfjs.getDocument({ data });
    const doc = await task.promise;
    const page = await doc.getPage(1);

    const canvas = canvasRef.current!;
    const cssWidth = canvas.parentElement!.clientWidth;
    const scale = (cssWidth / page.getViewport({ scale: 1 }).width) * window.devicePixelRatio;
    const viewport = page.getViewport({ scale });
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    canvas.style.width = `${cssWidth}px`;
    await page.render({ canvas, viewport }).promise;
    await task.destroy();
    return res.headers.get("x-render-ms");
  }

  const button =
    "rounded-lg bg-primary px-4 py-3 font-semibold text-white disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <h1 className="text-2xl font-bold">Preview spike</h1>
      <p className="mt-2 text-sm text-muted">
        Open on a low/mid-range Android phone. Tap each option a few times (the first pdf.js run
        includes downloading pdf.js). Compare speed and how sharp the text looks when zoomed.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          className={button}
          disabled={busy}
          onClick={() => measure("A: image (PNG)", () => showImage("png"))}
        >
          A: image (PNG)
        </button>
        <button
          className={button}
          disabled={busy}
          onClick={() => measure("A: image (WebP)", () => showImage("webp"))}
        >
          A: image (WebP)
        </button>
        <button className={button} disabled={busy} onClick={() => measure("B: pdf.js", showPdfJs)}>
          B: pdf.js
        </button>
      </div>

      {error && <p className="mt-4 text-danger">{error}</p>}

      <table className="mt-6 w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="py-2">Option</th>
            <th>Total ms</th>
            <th>Server ms</th>
            <th>Downloaded KB</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r, i) => (
            <tr key={i} className="border-b border-border/40">
              <td className="py-2">{r.option}</td>
              <td>{r.totalMs}</td>
              <td>{r.serverMs ?? "–"}</td>
              <td>{r.downloadedKb}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <figure>
          <figcaption className="mb-2 font-semibold">A: server image</figcaption>
          {/* eslint-disable-next-line @next/next/no-img-element -- blob URL, measured on purpose */}
          <img
            ref={imgRef}
            alt="Resume preview (server image)"
            className="w-full border border-border"
          />
        </figure>
        <figure>
          <figcaption className="mb-2 font-semibold">B: pdf.js in the browser</figcaption>
          <div>
            <canvas ref={canvasRef} className="border border-border" />
          </div>
        </figure>
      </div>
    </main>
  );
}
