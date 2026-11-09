import type { Metadata } from "next";
import { AuthCard } from "@/components/ui";
import { LoginForm } from "@/features/auth/forms";
import { getUser, safeNext } from "@/lib/auth";

// Checks the login on every visit, so navigating here waits for the server (plan 6.3).
export const instant = false;

export const metadata: Metadata = { title: "Log in" };

const NOTICES: Record<string, string> = {
  link: "That link has expired or was already used. Log in, or request a new link.",
  google: "Google sign-in didn't work. Please try again.",
  reauth: "For your security, please log in again to continue.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const user = await getUser();
  const reason = typeof params.error === "string" ? params.error : params.reauth ? "reauth" : "";
  const notice =
    NOTICES[reason] ??
    (user?.is_anonymous
      ? "Log in to your account — the resume you started comes with you."
      : undefined);
  return (
    <AuthCard title="Log in">
      <LoginForm next={safeNext(params.next)} notice={notice} />
    </AuthCard>
  );
}
