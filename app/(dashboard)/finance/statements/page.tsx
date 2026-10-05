import { getPermissionForRoute } from "@/lib/data/nav";
import { redirect } from "next/navigation";
import StatementExplorer from "../_components/StatementExplorer";

export const metadata = { title: "Customer Statements — Beesmart Billing" };

export default async function StatementsPage() {
  const pagePerms = await getPermissionForRoute("/finance/statements");
  if (!pagePerms.canView) redirect("/dashboard");

 return <StatementExplorer />;
}