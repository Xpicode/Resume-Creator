import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/ui";
import { ConsentForm } from "@/features/auth/forms";
import { getUser, safeNext } from "@/lib/auth";

// Checks the login on every visit, so navigating here waits for the server (plan 6.3).
export const instant = false;

export const metadata: Metadata = { title: "One more step" };

export default async function ConsentPage({ searchParams }: PageProps<"/auth/consent">) {
  if (!(await getUser())) redirect("/login");
  const { next } = await searchParams;
  return (
    <AuthCard title="One more step">
      <p className="mb-6 text-muted">
        Please review and accept our Privacy Policy and Terms to continue.
      </p>
      <ConsentForm next={safeNext(next)} />
    </AuthCard>
  );
}
