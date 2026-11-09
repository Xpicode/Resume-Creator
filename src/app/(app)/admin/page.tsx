import type { Metadata } from "next";
import { buttonClass } from "@/components/ui";
import { revokeCode } from "@/features/billing/code-actions";
import { GenerateCodesForm } from "@/features/billing/generate-codes-form";
import { PASS, peso } from "@/features/billing/plans";
import { ConfirmButton } from "@/features/resume/confirm-button";
import { requireAdmin } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Checks the login on every visit, so navigating here waits for the server (plan 6.3).
export const instant = false;

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

const fmt = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Manila",
});

export default async function AdminPage() {
  await requireAdmin();
  const admin = supabaseAdmin();
  const { data: codes } = await admin
    .from("pass_codes")
    .select("id, code_hint, note, created_at, redeemed_by, redeemed_at, revoked_at")
    .order("created_at", { ascending: false })
    .limit(100);
  const rows = codes ?? [];

  // Who redeemed each code (emails come from Supabase Auth, not a table we keep).
  const userIds = [...new Set(rows.map((r) => r.redeemed_by).filter(Boolean))] as string[];
  const emails = new Map(
    await Promise.all(
      userIds.map(async (id) => {
        const { data } = await admin.auth.admin.getUserById(id);
        return [id, data.user?.email ?? "deleted account"] as const;
      }),
    ),
  );
  const redeemed = rows.filter((r) => r.redeemed_at && !r.revoked_at).length;

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 space-y-8 px-4 py-8">
      <h1 className="text-2xl font-bold">Admin · Pass codes</h1>

      <section aria-labelledby="new" className="rounded-xl border border-border/60 bg-white p-5">
        <h2 id="new" className="text-lg font-semibold">
          New codes
        </h2>
        <p className="mt-1 mb-4 text-sm text-muted">
          Each code gives one {PASS.name}: {PASS.days} days, {PASS.aiCredits} AI credits, up to{" "}
          {PASS.resumeLimit} resumes. Generate one after the customer pays you{" "}
          {peso(PASS.amountCentavos)}, then send them the code.
        </p>
        <GenerateCodesForm />
      </section>

      <section aria-labelledby="list">
        <h2 id="list" className="text-lg font-semibold">
          Recent codes
        </h2>
        <p className="mt-1 text-sm text-muted">
          {rows.length} shown · {redeemed} in use. Revoking a used code ends that customer&apos;s
          pass (use it for refunds).
        </p>
        {rows.length ? (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="py-2 font-medium">Code</th>
                  <th className="py-2 font-medium">Note</th>
                  <th className="py-2 font-medium">Created</th>
                  <th className="py-2 font-medium">Status</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-border/30 align-top">
                    <td className="py-2 font-mono">…{r.code_hint}</td>
                    <td className="py-2">{r.note}</td>
                    <td className="py-2">{fmt.format(new Date(r.created_at))}</td>
                    <td className="py-2">
                      {r.revoked_at
                        ? `Revoked ${fmt.format(new Date(r.revoked_at))}`
                        : r.redeemed_at
                          ? `Used by ${emails.get(r.redeemed_by!) ?? "deleted account"}, ${fmt.format(new Date(r.redeemed_at))}`
                          : "Not used yet"}
                    </td>
                    <td className="py-2 text-right">
                      {!r.revoked_at && (
                        <form action={revokeCode}>
                          <input type="hidden" name="id" value={r.id} />
                          <ConfirmButton
                            message={
                              r.redeemed_at
                                ? "Revoke this code? The customer's pass ends right away (refund)."
                                : "Revoke this code? It will stop working."
                            }
                            className={`${buttonClass.ghost} text-danger`}
                          >
                            Revoke
                          </ConfirmButton>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-2 text-muted">No codes yet.</p>
        )}
      </section>
    </main>
  );
}
