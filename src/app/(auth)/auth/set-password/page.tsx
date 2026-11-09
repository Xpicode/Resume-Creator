import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/ui";
import { SetPasswordForm } from "@/features/auth/forms";
import { getUser } from "@/lib/auth";

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
