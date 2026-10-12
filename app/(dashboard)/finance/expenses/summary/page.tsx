import { getPermissionForRoute } from "@/lib/data/nav";
import { redirect } from "next/navigation";
import ExpenseSummaryView from "../../_components/ExpenseSummaryView";

export const metadata = { title: "Expense Summary — SpeedLink" };

export default async function SummaryPage() {
  const pagePerms = await getPermissionForRoute("/finance/expenses");
  if (!pagePerms.canView) redirect("/dashboard");

 return <ExpenseSummaryView />;
}