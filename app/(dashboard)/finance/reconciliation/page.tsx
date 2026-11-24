import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getDarajaReconciliation, getReconciliationDay } from "@/actions/payments";
import { todayEatIso } from "@/lib/dates";
import { canAccessPaybillRegister, canAccessReconciliation } from "@/lib/utils/reconciliationAccess";
import { DarajaPullTrigger } from "@/components/finance/DarajaPullTrigger";
import { ReconciliationDayView } from "@/components/finance/ReconciliationDayView";
import { PaybillTransactionsPanel } from "@/components/finance/PaybillTransactionsPanel";
import { getAccess } from "@/lib/data/access";
import { isCustomerAccess, isInvestorAccess } from "@/lib/access";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "M-Pesa Reconciliation | SpeedLink",
  description: "Daraja PullTransactions sweep and daily reconciliation for M-Pesa payments.",
};

export default async function ReconciliationPage({
  searchParams,
}: {
  searchParams: Promise<{ paybill?: string }>;
}) {
  const access = await getAccess();
  const { paybill } = await searchParams;
  // a receipt from the universal search (Ctrl+K): letters and digits only
  const paybillQuery = typeof paybill === "string" ? paybill.replace(/[^A-Za-z0-9]/g, "").slice(0, 40) : "";

  // Staff see the paybill payments only; the reconciliation itself stays with
  // 01 Admin / 02 Management. Investors and customers go to their own pages.
  if (!canAccessPaybillRegister(access)) {
    if (isInvestorAccess(access)) redirect("/finance/investor");
    if (isCustomerAccess(access)) redirect("/portal/pppoe");
    redirect("/dashboard");
  }
  if (!canAccessReconciliation(access)) {
    return (
      <div className="min-h-screen p-4 text-foreground sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div>
            <span className="text-[11px] font-sans tabular-nums tracking-wider text-muted-foreground uppercase">
              FINANCE — PAYBILL PAYMENTS
            </span>
            <h1 className="text-3xl font-sans font-normal text-foreground">Paybill payments.</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Find a payment a customer says they made, and give it to the right account.
            </p>
          </div>
          <PaybillTransactionsPanel initialQuery={paybillQuery} canChange />
        </div>
      </div>
    );
  }

  const day = todayEatIso();
  const [{ entries, summary, message }, dayView] = await Promise.all([
    getDarajaReconciliation(day),
    getReconciliationDay(day),
  ]);

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
            What came in, who got connected, and what someone needs to act on.
            Admin &amp; management; staff see the paybill payments.
          </p>
        </div>

        {paybillQuery && <PaybillTransactionsPanel initialQuery={paybillQuery} canChange />}

        <ReconciliationDayView
          initialDate={day}
          initialData={dayView.data}
          initialMessage={dayView.message}
        />

        {!paybillQuery && <PaybillTransactionsPanel canChange />}

        <div className="pt-4">
          <span className="text-[11px] font-sans tabular-nums tracking-wider text-muted-foreground uppercase">
            Safaricom cross-check — detail
          </span>
          <p className="mt-1 text-xs text-muted-foreground">
            Compares Safaricom&apos;s own transaction list (Daraja PullTransactions) with IBS. While
            Safaricom returns nothing, every row below shows as &ldquo;unmatched in Daraja&rdquo; — see the
            status above before acting on it.
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