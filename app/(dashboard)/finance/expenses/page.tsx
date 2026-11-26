import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getExpenses, getExpenseSummary } from "@/actions/finance";
import { getPermissionForRoute } from "@/lib/data/nav";
import ExpenseTable from "../_components/ExpenseTable";
import { getCompanyFeeStatus, getFeeReceivingAccount } from "@/actions/platformFees";
import { auth } from "@/lib/auth";
import { SystemFeesPanel } from "@/components/finance/SystemFeesPanel";
import { getAccess } from "@/lib/data/access";
import { holdsRight } from "@/lib/access";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Expense Management",
};

export default async function ExpensesPage() {
  const pagePerms = await getPermissionForRoute("/finance/expenses");
  if (!pagePerms.canView) redirect("/dashboard");

  const access = await getAccess();
  // the SYSTEM_FEE_PAY right pays the company's own agreement; the super admin may pay any
  const canPay = access.superAdmin ? "ANY" : holdsRight(access, "SYSTEM_FEE_PAY") ? "COMPANY" : null;

  const [initialExpenses, initialSummary, feeStatus, feeAccount] = await Promise.all([
    getExpenses({ page: 0, size: 20 }),
    getExpenseSummary(),
    // null for a SYSADMIN viewing all companies: fees are shown per company
    getCompanyFeeStatus(),
    canPay ? getFeeReceivingAccount() : Promise.resolve(null),
  ]);

  return (
    <>
      {feeStatus && (
        <div className="px-4 pt-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <SystemFeesPanel status={feeStatus} account={feeAccount} canPay={canPay} />
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