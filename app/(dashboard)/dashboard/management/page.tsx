import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { resolveDashboardPathForRole } from "@/lib/utils/dashboardRouting";
import { getCustomers } from "@/actions/customer";
import { getPackagesAction } from "@/actions/packages";
import { ManagementDashboardShell } from "./_components/ManagementDashboardShell";
import { addDaysToDateOnly, todayEatIso } from "@/lib/dates";

export const metadata = { title: "Management Dashboard — Ikonex Systems" };

export default async function ManagementDashboardPage() {
 const session = await auth();
 const correctPath = resolveDashboardPathForRole(session?.user?.role);

 if (correctPath !== "/dashboard/management") {
 redirect(correctPath);
 }

 const today = todayEatIso();
 const thirtyDaysFromNow = addDaysToDateOnly(today, 30);

 const [allCustomersRes, activeCustomersRes, pppoeCustomersRes, packagesRes] =
 await Promise.all([
 getCustomers(0, 1),
 getCustomers(0, 1, { isActive: true }),
 getCustomers(0, 50, { custtype: "pppoe" }),
 getPackagesAction(),
 ]);

  const totalCustomers = allCustomersRes.data?.totalElements ?? 0;
  const activeCustomers = activeCustomersRes.data?.totalElements ?? 0;
  const allPPPoE = pppoeCustomersRes.success ? (pppoeCustomersRes.data?.content ?? []) : [];
  const packages = packagesRes.success ? (packagesRes.data ?? []) : [];

  // Customers whose subscription expires within 30 days
  const expiringCustomers = allPPPoE.filter((c: { expiryDate: string | null }) => {
    if (!c.expiryDate) return false;
    return c.expiryDate >= today && c.expiryDate <= thirtyDaysFromNow;
  });

 const greeting = `Welcome, ${session?.user?.fname ?? "Manager"}`;

 return (
 <div className="flex-1 p-8 pt-6">
 <ManagementDashboardShell
 totalCustomers={totalCustomers}
 activeCustomers={activeCustomers}
 pppoeCustomers={allPPPoE.length}
 packages={packages}
 expiringCustomers={expiringCustomers}
 greeting={greeting}
 />
 </div>
 );
}
