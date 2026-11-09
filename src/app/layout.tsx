import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
});

// Headings only: friendly, a little hand-made — like a label written on an envelope.
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700", "800"],
});

const description =
  "Free resume builder made for Filipino job seekers: PH sections like OJT, Trainings & Seminars and Eligibility, ATS-friendly templates, and honest AI help.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s — ${SITE_NAME}` },
  description,
  openGraph: { type: "website", siteName: SITE_NAME, locale: "en_PH", description },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${bricolage.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
