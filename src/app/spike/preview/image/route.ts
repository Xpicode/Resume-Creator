// THROWAWAY Phase 0 spike: page 1 of the sample resume as an image, made on the server.
import { createCanvas } from "@napi-rs/canvas";
import { connection, type NextRequest } from "next/server";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { renderSamplePdf } from "../sample-pdf";

// Bundled server code can't locate pdf.js's worker file, so load the worker in-process:
// pdf.js uses `globalThis.pdfjsWorker` instead of spawning one.
const pdfjsGlobal = globalThis as { pdfjsWorker?: unknown };
pdfjsGlobal.pdfjsWorker ??= await import("pdfjs-dist/legacy/build/pdf.worker.mjs");

export async function GET(request: NextRequest) {
  await connection();
  const format = request.nextUrl.searchParams.get("format") === "webp" ? "webp" : "png";
  const start = performance.now();

  const pdf = await renderSamplePdf();
  const task = getDocument({ data: new Uint8Array(pdf) });
  const doc = await task.promise;
  try {
    const page = await doc.getPage(1);
    const viewport = page.getViewport({ scale: 2 }); // A4 → ~1190px wide, sharp on phones
    const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({
      canvas: null,
      canvasContext: ctx as unknown as CanvasRenderingContext2D,
      viewport,
    }).promise;

    const image = format === "webp" ? await canvas.encode("webp", 90) : await canvas.encode("png");
    const ms = Math.round(performance.now() - start);

    return new Response(new Uint8Array(image), {
      headers: {
        "Content-Type": `image/${format}`,
        "Cache-Control": "no-store",
        "X-Render-Ms": String(ms),
        "X-Robots-Tag": "noindex",
      },
    });
  } finally {
    await task.destroy();
  }
}
