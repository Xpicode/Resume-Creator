import "server-only";
import { createCanvas } from "@napi-rs/canvas";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

// Bundled server code can't locate pdf.js's worker file, so run the worker in-process:
// pdf.js uses `globalThis.pdfjsWorker` instead of spawning one.
const pdfjsGlobal = globalThis as { pdfjsWorker?: unknown };
pdfjsGlobal.pdfjsWorker ??= await import("pdfjs-dist/legacy/build/pdf.worker.mjs");

const GAP = 24;

/**
 * Renders every page of a PDF, stacked vertically, into one WebP image for the live preview.
 * Chosen in Phase 0 (plan 3.2): no PDF library in the browser, works on any phone.
 */
export async function pdfToPreviewImage(
  pdf: Buffer,
  scale = 1.5,
): Promise<{ image: Buffer; pageCount: number }> {
  const task = getDocument({ data: new Uint8Array(pdf) });
  try {
    const doc = await task.promise;
    const pages = await Promise.all(
      Array.from({ length: doc.numPages }, (_, i) => doc.getPage(i + 1)),
    );
    const viewports = pages.map((p) => p.getViewport({ scale }));
    const width = Math.ceil(Math.max(...viewports.map((v) => v.width)));
    const height = Math.ceil(
      viewports.reduce((h, v) => h + v.height, 0) + GAP * (pages.length - 1),
    );

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#e2e8f0"; // gap colour between pages
    ctx.fillRect(0, 0, width, height);

    let y = 0;
    for (let i = 0; i < pages.length; i++) {
      const vp = viewports[i];
      ctx.save();
      ctx.translate(0, y);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, vp.width, vp.height);
      await pages[i].render({
        canvas: null,
        canvasContext: ctx as unknown as CanvasRenderingContext2D,
        viewport: vp,
      }).promise;
      ctx.restore();
      y += vp.height + GAP;
    }

    return { image: await canvas.encode("webp", 85), pageCount: pages.length };
  } finally {
    await task.destroy();
  }
}

export async function pdfPageCount(pdf: Buffer): Promise<number> {
  const task = getDocument({ data: new Uint8Array(pdf) });
  try {
    return (await task.promise).numPages;
  } finally {
    await task.destroy();
  }
}
