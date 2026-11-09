import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/ui";
import { StartForm } from "@/features/auth/forms";
import { getUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Start your resume" };

export default async function StartPage() {
  if (await getUser()) redirect("/dashboard");
  return (
    <AuthCard title="Start your resume — free">
      <p className="text-muted">
        No sign-up needed to start. You can create a free account later to keep your resume.
      </p>
      <div className="mt-6">
        <StartForm />
      </div>
      <p className="mt-6 text-sm">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary underline">
          Log in
        </Link>
      </p>
    </AuthCard>
  );
}
