import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SITE_NAME } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: SITE_NAME,
  description: "The resume builder made for how Filipinos actually apply for jobs.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
