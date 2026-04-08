import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { resolveDashboardPathForRole } from "@/lib/utils/dashboardRouting";

/**
 * Root dashboard route — immediately redirects to the correct sub-dashboard
 * based on the authenticated user's role code.
 */
export default async function DashboardRootPage() {
  const session = await auth();
  const targetPath = resolveDashboardPathForRole(session?.user?.role);
  redirect(targetPath);
}
