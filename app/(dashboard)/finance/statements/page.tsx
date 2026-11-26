import { getPermissionForRoute } from "@/lib/data/nav";
import { redirect } from "next/navigation";
import StatementExplorer from "../_components/StatementExplorer";

export const metadata = { title: "Customer Statements" };

export default async function StatementsPage() {
  // TODO(tenancy choice 14): a finance manager (03) must be able to view statements. The API
  // already lets them (API_STATEMENT View); only the screen is not granted. Grant View on
  // "Statements" to FINANCE_MANAGER on Access Control and this guard lets them in unchanged.
  const pagePerms = await getPermissionForRoute("/finance/statements");
  if (!pagePerms.canView) redirect("/dashboard");

 return <StatementExplorer />;
}