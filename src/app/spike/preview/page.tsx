// THROWAWAY Phase 0 spike (plan 3.2): compare two ways to show the PDF preview on phones.
import type { Metadata } from "next";
import { PreviewSpike } from "./preview-spike";

export const metadata: Metadata = {
  title: "Preview spike",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <PreviewSpike />;
}
