import { getPermissionForRoute } from "@/lib/data/nav";
import { redirect } from "next/navigation";
import StatementDetail from "../../_components/StatementDetail";

export const metadata = { title: "Statement Detail — Beesmart Billing" };

export default async function StatementDetailPage(props: { params: Promise<{ id: string }> }) {
  const pagePerms = await getPermissionForRoute("/finance/statements");
  if (!pagePerms.canView) redirect("/dashboard");

 return <StatementDetail paramsPromise={props.params} />;
}