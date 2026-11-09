import Link from "next/link";
import { buttonClass } from "@/components/ui";
import { SITE_NAME, SUPPORT_EMAIL } from "@/lib/site";

export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <header className="border-b border-border/40 bg-white">
        <nav className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <Link href="/" className="mr-auto font-bold text-primary">
            {SITE_NAME}
          </Link>
          <Link href="/#pricing" className="text-sm font-medium">
            Pricing
          </Link>
          <Link href="/blog" className="text-sm font-medium">
            Guides
          </Link>
          <Link href="/start" className={`${buttonClass.primary} px-3 py-1.5 text-sm`}>
            Start free
          </Link>
        </nav>
      </header>
      {children}
      <footer className="border-t border-border/40">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap gap-x-5 gap-y-2 px-4 py-8 text-sm text-muted">
          <span className="mr-auto">© {SITE_NAME}</span>
          <Link href="/blog" className="underline">
            Resume guides
          </Link>
          <Link href="/privacy-policy" className="underline">
            Privacy Policy
          </Link>
          <Link href="/terms" className="underline">
            Terms
          </Link>
          <Link href="/refund-policy" className="underline">
            Refund Policy
          </Link>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="underline">
            {SUPPORT_EMAIL}
          </a>
        </div>
      </footer>
    </>
  );
}
