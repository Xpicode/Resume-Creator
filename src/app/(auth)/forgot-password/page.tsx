import type { Metadata } from "next";
import { AuthCard } from "@/components/ui";
import { ForgotPasswordForm } from "@/features/auth/forms";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard title="Reset your password">
      <ForgotPasswordForm />
    </AuthCard>
  );
}
