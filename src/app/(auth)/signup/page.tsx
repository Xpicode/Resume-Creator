import type { Metadata } from "next";
import { AuthCard } from "@/components/ui";
import { SignUpForm } from "@/features/auth/forms";
import { getUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Create your account" };

export default async function SignUpPage() {
  const user = await getUser();
  const isGuest = Boolean(user?.is_anonymous);
  return (
    <AuthCard title={isGuest ? "Keep your resume" : "Create your free account"}>
      {isGuest && (
        <p className="mb-6 text-muted">
          Create a free account so you don&apos;t lose your resume. Everything you&apos;ve entered
          stays.
        </p>
      )}
      <SignUpForm isGuest={isGuest} />
    </AuthCard>
  );
}
