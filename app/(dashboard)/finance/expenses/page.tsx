import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getExpenses, getExpenseSummary } from "@/actions/finance";
import { getPermissionForRoute } from "@/lib/data/nav";
import ExpenseTable from "../_components/ExpenseTable";
import { getCompanyFeeStatus } from "@/actions/platformFees";
import { SystemFeesPanel } from "@/components/finance/SystemFeesPanel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Expense Management — Beesmart Billing",
};

export default async function ExpensesPage() {
  const pagePerms = await getPermissionForRoute("/finance/expenses");
  if (!pagePerms.canView) redirect("/dashboard");

  const [initialExpenses, initialSummary, feeStatus] = await Promise.all([
    getExpenses({ page: 0, size: 20 }),
    getExpenseSummary(),
    // null for a SYSADMIN viewing all companies: fees are shown per company
    getCompanyFeeStatus(),
  ]);

  return (
    <>
      {feeStatus && (
        <div className="px-4 pt-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <SystemFeesPanel status={feeStatus} />
          </div>
        </div>
      )}
      <ExpenseTable
        initialExpenses={initialExpenses.success ? (initialExpenses.data ?? undefined) : undefined}
        initialSummary={initialSummary.success ? (initialSummary.data ?? null) : null}
      />
    </>
  );
}