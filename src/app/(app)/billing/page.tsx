import type { Metadata } from "next";
import Link from "next/link";
import { buttonClass } from "@/components/ui";
import { creditsLeft } from "@/features/ai/guard";
import { startCheckout } from "@/features/billing/actions";
import { paymentsConfigured } from "@/features/billing/paymongo";
import { FREE, PASS, peso } from "@/features/billing/plans";
import { activePass, dateFmt } from "@/features/billing/status";
import { requireUser } from "@/lib/auth";
import { SUPPORT_EMAIL } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

// Checks the login on every visit, so navigating here waits for the server (plan 6.3).
export const instant = false;

export const metadata: Metadata = { title: "Billing" };

const ERRORS: Record<string, string> = {
  account: "Create an account and confirm your email before buying.",
  unavailable: "Payments aren't available yet. Please try again later.",
  rate: "Too many checkout attempts. Please wait an hour and try again.",
  checkout: "We couldn't open the payment page. You weren't charged — please try again.",
};
const STATUS: Record<string, string> = { paid: "Paid", refunded: "Refunded" };

export default async function BillingPage({ searchParams }: PageProps<"/billing">) {
  const user = await requireUser();
  const params = await searchParams;
  const supabase = await createClient();
  const [pass, credits, { data: payments }] = await Promise.all([
    activePass(supabase, user.id),
    creditsLeft(supabase, user.id),
    supabase
      .from("payments")
      .select("id, amount_centavos, status, created_at, paid_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);
  const error = typeof params.error === "string" ? ERRORS[params.error] : undefined;
  const latest = payments?.[0];
  // The success page only shows status — the webhook grants access (plan 3.2).
  const waiting = params.checkout === "done" && latest?.status === "pending";
  const history = (payments ?? []).filter((p) => p.status in STATUS); // abandoned checkouts aren't payments
  const canBuy = !user.is_anonymous && Boolean(user.email_confirmed_at);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 space-y-8 px-4 py-8">
      {waiting && <meta httpEquiv="refresh" content="5" />}
      <h1 className="text-2xl font-bold">Billing</h1>

      {error && (
        <p role="alert" className="rounded-lg bg-primary-soft p-3 text-sm text-danger">
          {error}
        </p>
      )}
      {waiting && (
        <p role="status" className="rounded-lg bg-primary-soft p-3 text-sm">
          Thanks! We&apos;re confirming your payment with PayMongo. This page refreshes by itself —
          it usually takes less than a minute.
        </p>
      )}
      {params.checkout === "done" && latest?.status === "paid" && (
        <p role="status" className="rounded-lg bg-primary-soft p-3 text-sm">
          Payment received — your Job Hunt Pass is active. A receipt was sent to your email.
        </p>
      )}
      {params.checkout === "cancelled" && (
        <p role="status" className="rounded-lg bg-primary-soft p-3 text-sm">
          Payment cancelled. You weren&apos;t charged.
        </p>
      )}

      <section aria-labelledby="plan" className="rounded-xl border border-border/60 bg-white p-5">
        <h2 id="plan" className="text-lg font-semibold">
          Your plan
        </h2>
        <p className="mt-2 text-xl font-bold">
          {pass ? `${PASS.name}` : "Free"}
          {pass && (
            <span className="ml-2 text-base font-normal text-muted">
              until {dateFmt.format(new Date(pass.endsAt))}
            </span>
          )}
        </p>
        <p className="mt-1 text-muted">
          {user.is_anonymous ? "Guest session" : `${credits} AI credits left`} · up to{" "}
          {pass ? PASS.resumeLimit : FREE.resumeLimit} resume{pass ? "s" : ""}
        </p>
      </section>

      <section aria-labelledby="pass" className="rounded-xl bg-primary-soft p-5">
        <h2 id="pass" className="text-lg font-semibold">
          {PASS.name} — {peso(PASS.amountCentavos)} for {PASS.days} days
        </h2>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>More resumes — one for each kind of job (up to {PASS.resumeLimit})</li>
          <li>Duplicate a resume, then tailor the copy to a job post</li>
          <li>{PASS.aiCredits} extra AI credits (about 33 job tailorings)</li>
          <li>Pay once with GCash, Maya or card — it does not renew by itself</li>
        </ul>
        <p className="mt-3 text-sm text-muted">
          When the pass ends you keep every resume and can still edit and download them. Free
          features never go away.
        </p>
        {canBuy ? (
          <form action={startCheckout} className="mt-4">
            <button type="submit" className={buttonClass.primary} disabled={!paymentsConfigured()}>
              {pass ? `Add ${PASS.days} more days — ${peso(PASS.amountCentavos)}` : "Get the pass"}
            </button>
            {!paymentsConfigured() && (
              <p className="mt-2 text-sm text-muted">Payments open soon.</p>
            )}
          </form>
        ) : (
          <p className="mt-4">
            {user.is_anonymous ? (
              <Link href="/signup" className="font-medium text-primary underline">
                Create a free account
              </Link>
            ) : (
              "Confirm your email address"
            )}{" "}
            first — the pass is linked to your account.
          </p>
        )}
        <p className="mt-3 text-sm text-muted">
          Secure payment by PayMongo. See our{" "}
          <Link href="/refund-policy" className="underline">
            Refund Policy
          </Link>
          .
        </p>
      </section>

      <section aria-labelledby="history">
        <h2 id="history" className="text-lg font-semibold">
          Payment history
        </h2>
        {history.length ? (
          <table className="mt-3 w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border/60">
                <th className="py-2 font-medium">Date</th>
                <th className="py-2 font-medium">Item</th>
                <th className="py-2 font-medium">Amount</th>
                <th className="py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((p) => (
                <tr key={p.id} className="border-b border-border/30">
                  <td className="py-2">{dateFmt.format(new Date(p.paid_at ?? p.created_at))}</td>
                  <td className="py-2">{PASS.name}</td>
                  <td className="py-2">{peso(p.amount_centavos)}</td>
                  <td className="py-2">{STATUS[p.status]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="mt-2 text-muted">No payments yet.</p>
        )}
        <p className="mt-3 text-sm text-muted">
          Receipts are emailed by PayMongo. Questions or refund requests:{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="underline">
            {SUPPORT_EMAIL}
          </a>
        </p>
      </section>
    </main>
  );
}
