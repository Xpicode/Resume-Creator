import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/ui";
import { SetPasswordForm } from "@/features/auth/forms";
import { getUser } from "@/lib/auth";

// Checks the login on every visit, so navigating here waits for the server (plan 6.3).
export const instant = false;

export const metadata: Metadata = { title: "Set a new password" };

export default async function SetPasswordPage() {
  const user = await getUser();
  if (!user || user.is_anonymous) redirect("/login");
  return (
    <AuthCard title="Set a new password">
      <SetPasswordForm />
    </AuthCard>
  );
}
