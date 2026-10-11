import { redirect } from "next/navigation";
import { getAdminDashboardData } from "@/actions/dashboard";
import { resolveDashboardPathForRole } from "@/lib/utils/dashboardRouting";
import { auth } from "@/lib/auth";
import { AdminDashboardView } from "../_components/AdminDashboardView";

export const metadata = { title: "Admin Dashboard — Ikonex Systems" };
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await auth();
  const correctPath = resolveDashboardPathForRole(session?.user?.role);
  if (correctPath !== "/dashboard/admin") redirect(correctPath);

  const result = await getAdminDashboardData();
  if (!result.success) {
    return <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8"><div role="alert" className="mx-auto max-w-7xl rounded-lg border border-destructive/30 bg-destructive/5 p-5"><h1 className="text-lg font-medium">Dashboard unavailable</h1><p className="mt-1 text-sm text-muted-foreground">{result.message}{result.requestId ? ` · Ref: ${result.requestId}` : ""}</p></div></div>;
  }

  return <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8"><div className="mx-auto max-w-7xl"><AdminDashboardView data={result.data} /></div></div>;
}
