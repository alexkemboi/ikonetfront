import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getDarajaReconciliation } from "@/actions/payments";
import { getPermissionForRoute } from "@/lib/data/nav";
import { todayEatIso } from "@/lib/dates";
import { normalizeRole, ROLE_NAME } from "@/lib/types/roles";
import { DarajaPullTrigger } from "@/components/finance/DarajaPullTrigger";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "M-Pesa Reconciliation | Beesmart Billing",
  description: "Daraja PullTransactions sweep and daily reconciliation for M-Pesa payments.",
};

export default async function ReconciliationPage() {
  const session = await auth();
  const role = normalizeRole(session?.user?.role);

  // 01 Admin / 02 Management only. Staff, investor, and customer are redirected
  // to their own landing routes; the reconciliation UI stays hidden from them.
  if (role === ROLE_NAME.STAFF) redirect("/customers");
  if (role === ROLE_NAME.INVESTOR) redirect("/finance/investor");
  if (role === ROLE_NAME.CUSTOMER) redirect("/portal/pppoe");
  if (role !== ROLE_NAME.ADMIN && role !== ROLE_NAME.MANAGEMENT) redirect("/dashboard");

  const pagePerms = await getPermissionForRoute("/finance/reconciliation");
  if (!pagePerms.canView) redirect("/dashboard");

  const day = todayEatIso();
  const { entries, summary, message } = await getDarajaReconciliation(day);

  return (
    <div className="min-h-screen p-4 text-foreground sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <span className="text-[11px] font-sans tabular-nums tracking-wider text-muted-foreground uppercase">
            FINANCE — RECONCILIATION
          </span>
          <h1 className="text-3xl font-sans font-normal text-foreground">
            M-Pesa reconciliation.
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Run the Daraja PullTransactions sweep and review daily reconciliation
            entries. Admin &amp; management only.
          </p>
        </div>

        {message && (
          <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            {message}
          </div>
        )}

        <DarajaPullTrigger
          initialDate={day}
          initialEntries={entries}
          initialSummary={summary}
        />
      </div>
    </div>
  );
}