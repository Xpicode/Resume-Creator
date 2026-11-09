import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/ui";
import { AdminLoginForm } from "@/features/auth/forms";
import { isAdmin } from "@/lib/admin";
import { getUser } from "@/lib/auth";

// Checks the login on every visit, so navigating here waits for the server (plan 6.3).
export const instant = false;

export const metadata: Metadata = {
  title: "Admin login",
  robots: { index: false, follow: false },
};

/** Separate login for the admin area (pass codes). Bookmark it — it isn't linked anywhere. */
export default async function AdminLoginPage() {
  if (isAdmin(await getUser())) redirect("/admin");
  return (
    <AuthCard title="Admin login">
      <p className="-mt-2 mb-6 text-sm text-muted">
        For the site owner only. Customers log in{" "}
        <Link href="/login" className="text-primary underline">
          here
        </Link>
        .
      </p>
      <AdminLoginForm />
      <p className="mt-6 text-sm">
        <Link href="/forgot-password" className="text-primary underline">
          Forgot password?
        </Link>
      </p>
    </AuthCard>
  );
}
