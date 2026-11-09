import type { Metadata } from "next";
import Link from "next/link";
import { POSTS } from "@/features/blog/posts";

export const metadata: Metadata = {
  title: "Resume guides for Filipino job seekers",
  description: "Free, practical guides for writing a resume in the Philippines.",
  alternates: { canonical: "/blog" },
};

export default function BlogPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
      <h1 className="text-3xl font-bold">Resume guides</h1>
      <p className="mt-2 text-muted">Practical advice for applying to jobs in the Philippines.</p>
      <ul className="mt-8 space-y-6">
        {POSTS.map((p) => (
          <li key={p.slug}>
            <h2 className="text-lg font-semibold">
              <Link href={`/blog/${p.slug}`} className="text-primary hover:underline">
                {p.title}
              </Link>
            </h2>
            <p className="mt-1 text-muted">{p.description}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
