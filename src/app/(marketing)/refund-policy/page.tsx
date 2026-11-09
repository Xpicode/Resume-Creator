import type { Metadata } from "next";
import { PASS, peso } from "@/features/billing/plans";
import { REFUND_POLICY_VERSION } from "@/lib/legal";
import { SUPPORT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Refund Policy",
  alternates: { canonical: "/refund-policy" },
};

// DRAFT (plan Section 12 launch checklist). Must be reviewed by a lawyer before taking real payments.
export default function RefundPolicyPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
      <h1 className="text-3xl font-bold">Refund Policy</h1>
      <p className="mt-2 text-sm text-muted">Draft · Version {REFUND_POLICY_VERSION}</p>

      <div className="mt-8 space-y-6 [&_h2]:text-lg [&_h2]:font-semibold [&_li]:mt-1 [&_p]:mt-1 [&_p]:text-muted [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:text-muted">
        <section>
          <h2>What you buy</h2>
          <p>
            The {PASS.name} costs {peso(PASS.amountCentavos)} and lasts {PASS.days} days from
            payment. It is a one-time payment and does not renew by itself.
          </p>
        </section>
        <section>
          <h2>Full refund within 7 days</h2>
          <p>
            If you are not happy with the pass, email{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary underline">
              {SUPPORT_EMAIL}
            </a>{" "}
            within 7 days of payment from the email address of your account. We refund the full
            amount to the same GCash, Maya or card you paid with.
          </p>
        </section>
        <section>
          <h2>Charged by mistake or twice</h2>
          <p>
            If you were charged twice or the pass did not activate, contact us anytime and we will
            fix it or refund you in full.
          </p>
        </section>
        <section>
          <h2>What happens after a refund</h2>
          <ul>
            <li>The pass ends and its remaining AI credits are removed.</li>
            <li>You keep all your resumes and can still edit and download them.</li>
            <li>
              Refunds are processed by PayMongo. Depending on your payment method, the money can
              take a few days to arrive.
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}
