import Link from "next/link";
import { connection } from "next/server";
import { buttonClass } from "@/components/ui";
import { logOut } from "@/features/auth/actions";
import { isAdmin } from "@/lib/admin";
import { requireUser } from "@/lib/auth";
import { SITE_NAME, SUPPORT_EMAIL } from "@/lib/site";

// Logged-in area: strict nonce CSP needs per-request rendering (plan 6.6), and every page
// reads the session anyway. Each page still calls requireUser() itself (plan 6.3).
export const instant = false;

export default async function AppLayout({ children }: LayoutProps<"/">) {
  await connection();
  const user = await requireUser();
  return (
    <>
      <header className="border-b border-border/40 bg-white">
        <nav className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <Link href="/dashboard" className="mr-auto font-bold text-primary">
            {SITE_NAME}
          </Link>
          <Link href="/dashboard" className="text-sm font-medium">
            My resumes
          </Link>
          {!user.is_anonymous && (
            <Link href="/billing" className="text-sm font-medium">
              Billing
            </Link>
          )}
          <Link href="/settings" className="text-sm font-medium">
            Settings
          </Link>
          {isAdmin(user) && (
            <Link href="/admin" className="text-sm font-medium text-primary">
              Admin
            </Link>
          )}
          {user.is_anonymous ? (
            <Link href="/signup" className={`${buttonClass.primary} px-3 py-1.5 text-sm`}>
              Save my resume
            </Link>
          ) : (
            <form action={logOut}>
              <button type="submit" className="text-sm font-medium text-muted underline">
                Log out
              </button>
            </form>
          )}
        </nav>
      </header>
      {user.is_anonymous && (
        <p className="bg-primary-soft px-4 py-2 text-center text-sm">
          You&apos;re using a guest session.{" "}
          <Link href="/signup" className="font-medium text-primary underline">
            Create a free account
          </Link>{" "}
          to keep your resume — guest resumes are deleted after 30 days without use.
        </p>
      )}
      {children}
      <footer className="mx-auto w-full max-w-6xl px-4 py-6 text-sm text-muted">
        Found a problem or have an idea?{" "}
        <a
          href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`${SITE_NAME} feedback`)}`}
          className="font-medium text-primary underline"
        >
          Send feedback
        </a>
      </footer>
    </>
  );
}
