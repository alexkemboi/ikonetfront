import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getExpenses, getExpenseSummary } from "@/actions/finance";
import { getPermissionForRoute } from "@/lib/data/nav";
import ExpenseTable from "../_components/ExpenseTable";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Expense Management — Beesmart Billing",
};

export default async function ExpensesPage() {
  const pagePerms = await getPermissionForRoute("/finance/expenses");
  if (!pagePerms.canView) redirect("/dashboard");

  const [initialExpenses, initialSummary] = await Promise.all([
    getExpenses({ page: 0, size: 20 }),
    getExpenseSummary(),
  ]);

  return (
    <ExpenseTable
      initialExpenses={initialExpenses.success ? (initialExpenses.data ?? undefined) : undefined}
      initialSummary={initialSummary.success ? (initialSummary.data ?? null) : null}
    />
  );
}