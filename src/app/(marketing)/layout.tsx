import Link from "next/link";
import { buttonClass } from "@/components/ui";
import { SITE_NAME, SUPPORT_EMAIL } from "@/lib/site";

export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <header className="sticky top-0 z-20 border-b border-border/30 bg-white/90 backdrop-blur">
        <nav className="mx-auto flex w-full max-w-5xl items-center gap-x-4 px-4 py-3">
          <Link
            href="/"
            className="mr-auto flex items-center gap-2 font-[family-name:var(--font-bricolage)] text-lg font-bold text-primary"
          >
            <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
              <rect x="4" y="2" width="16" height="20" rx="2" fill="var(--kraft)" />
              <rect
                x="7"
                y="0.5"
                width="10"
                height="11"
                rx="1"
                fill="#fff"
                stroke="var(--primary)"
              />
              <path d="M9 4h6M9 6.5h4" stroke="var(--primary)" strokeLinecap="round" />
              <rect x="4" y="11" width="16" height="11" rx="2" fill="var(--kraft-dark)" />
            </svg>
            {SITE_NAME}
          </Link>
          {/* On phones the header is just logo + Start free; these are in the page and footer. */}
          <Link href="/#pricing" className="hidden text-sm font-medium sm:inline">
            Pricing
          </Link>
          <Link href="/blog" className="hidden text-sm font-medium sm:inline">
            Guides
          </Link>
          <Link href="/start" className={`${buttonClass.primary} shrink-0 px-3 py-1.5 text-sm`}>
            Start free
          </Link>
        </nav>
      </header>
      {children}
      <footer className="border-t border-border/40 bg-desk">
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
          {/* Small on purpose: only the owner needs it. The page itself stays noindex. */}
          <Link href="/admin-login" className="text-muted/70 underline" rel="nofollow">
            Admin
          </Link>
        </div>
      </footer>
    </>
  );
}
