import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { resolveDashboardPathForRole } from "@/lib/utils/dashboardRouting";
import { getCustomers } from "@/actions/customer";
import { getPackagesAction } from "@/actions/packages";
import { getMikrotikDevices } from "@/actions/mikrotik";
import { DashboardShell } from "../_components/DashboardShell";

export default async function AdminDashboardPage() {
  const session = await auth();
  const correctPath = resolveDashboardPathForRole(session?.user?.role);

  // Redirect away if this role does not belong here
  if (correctPath !== "/dashboard/admin") {
    redirect(correctPath);
  }

  const [
    allCustomersRes,
    activeCustomersRes,
    pppoeCustomersRes,
    packagesRes,
    devicesRes,
  ] = await Promise.all([
    getCustomers(0, 1),
    getCustomers(0, 1, { isActive: true }),
    getCustomers(0, 1, { custtype: "pppoe" }),
    getPackagesAction(),
    getMikrotikDevices(),
  ]);

  const totalCustomers = allCustomersRes.data?.totalElements ?? 0;
  const activeCustomers = activeCustomersRes.data?.totalElements ?? 0;
  const pppoeCustomers = pppoeCustomersRes.data?.totalElements ?? 0;
  const allPackages = packagesRes.success ? packagesRes.data : [];
  const activePackages = allPackages.filter((p) => p.activeStatus).length;
  const allDevices = devicesRes.success ? devicesRes.data : [];
  const onlineDevices = allDevices.filter((d) => d.online).length;

  return (
    <div className="flex-1 p-8 pt-6">
      <DashboardShell
        metrics={{
          totalCustomers,
          activeCustomers,
          inactiveCustomers: totalCustomers - activeCustomers,
          pppoeCustomers,
          totalPackages: allPackages.length,
          activePackages,
          inactivePackages: allPackages.length - activePackages,
          totalDevices: allDevices.length,
          onlineDevices,
          offlineDevices: allDevices.length - onlineDevices,
        }}
        devices={allDevices}
        packages={allPackages}
      />
    </div>
  );
}
