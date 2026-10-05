import { getPermissionForRoute } from "@/lib/data/nav";
import { redirect } from "next/navigation";
import StatementExplorer from "../_components/StatementExplorer";

export const metadata = { title: "Customer Statements — Beesmart Billing" };

export default async function StatementsPage() {
  // TODO(tenancy choice 14): a finance manager (03) must be able to view statements.
  // Today the catalogue denies it and the backend refuses role 03 on /api/v1/statements/**
  // (SecurityConfig). Needs two backend changes, then this guard lets them in unchanged:
  //   1. seed migration: FINANCE_MANAGER can_view on /finance/statements
  //   2. SecurityConfig: add "03" to the /api/v1/statements/** matcher
  const pagePerms = await getPermissionForRoute("/finance/statements");
  if (!pagePerms.canView) redirect("/dashboard");

 return <StatementExplorer />;
}