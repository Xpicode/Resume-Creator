// THROWAWAY Phase 0 spike: the sample resume as a PDF.
import { connection } from "next/server";
import { renderSamplePdf } from "../sample-pdf";

export async function GET() {
  await connection(); // render per request so timings are real
  const start = performance.now();
  const pdf = await renderSamplePdf();
  const ms = Math.round(performance.now() - start);

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Cache-Control": "no-store",
      "X-Render-Ms": String(ms),
      "X-Robots-Tag": "noindex",
    },
  });
}
