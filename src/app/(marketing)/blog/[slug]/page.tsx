import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonClass } from "@/components/ui";
import { POSTS, postBySlug } from "@/features/blog/posts";

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const post = postBySlug((await params).slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: { type: "article", title: post.title, description: post.description },
  };
}

const dateFmt = new Intl.DateTimeFormat("en-PH", { dateStyle: "long", timeZone: "Asia/Manila" });

export default async function PostPage({ params }: PageProps<"/blog/[slug]">) {
  const post = postBySlug((await params).slug);
  if (!post) notFound();
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
      <Link href="/blog" className="text-sm text-primary underline">
        ← All guides
      </Link>
      <article>
        <h1 className="mt-4 text-3xl font-bold text-balance">{post.title}</h1>
        <p className="mt-2 text-sm text-muted">
          <time dateTime={post.date}>{dateFmt.format(new Date(post.date))}</time>
        </p>
        <p className="mt-6 text-lg">{post.description}</p>
        {post.blocks.map((b) => (
          <section key={b.heading} className="mt-8">
            <h2 className="text-xl font-semibold">{b.heading}</h2>
            {b.paragraphs?.map((p) => (
              <p key={p} className="mt-3 leading-relaxed">
                {p}
              </p>
            ))}
            {b.bullets && (
              <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed">
                {b.bullets.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </article>
      <aside className="mt-12 rounded-xl bg-primary-soft p-5">
        <p className="font-semibold">Make your resume in about 15 minutes — free.</p>
        <p className="mt-1 text-muted">
          With the PH sections built in. No sign-up needed to start.
        </p>
        <Link href="/start" className={`${buttonClass.primary} mt-4`}>
          Create my resume
        </Link>
      </aside>
    </main>
  );
}
