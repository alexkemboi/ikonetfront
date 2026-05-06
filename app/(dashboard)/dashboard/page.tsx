import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getCustomers, getCustomerById } from "@/actions/customer";
import { getPackagesAction } from "@/actions/packages";
import { getMikrotikDevices } from "@/actions/mikrotik";
import { DashboardShell } from "./_components/DashboardShell";
import { ManagementDashboardShell } from "./_components/ManagementDashboardShell";
import { StaffDashboardShell } from "./_components/StaffDashboardShell";
import { CustomerDashboardShell } from "./_components/CustomerDashboardShell";

export default async function DashboardPage() {
  const session = await auth();
  const role = session?.user?.role ?? "";

  // ── Admin (01) ────────────────────────────────────────────────────────
  if (role === "01") {
    const [allRes, activeRes, pppoeRes, packagesRes, devicesRes] = await Promise.all([
      getCustomers(0, 1),
      getCustomers(0, 1, { isActive: true }),
      getCustomers(0, 1, { custtype: "pppoe" }),
      getPackagesAction(),
      getMikrotikDevices(),
    ]);

    const totalCustomers   = allRes.data?.totalElements ?? 0;
    const activeCustomers  = activeRes.data?.totalElements ?? 0;
    const pppoeCustomers   = pppoeRes.data?.totalElements ?? 0;
    const allPackages      = packagesRes.success ? packagesRes.data : [];
    const activePackages   = allPackages.filter((p) => p.activeStatus).length;
    const allDevices       = devicesRes.success ? devicesRes.data : [];
    const onlineDevices    = allDevices.filter((d) => d.online).length;

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

  // ── Management (02) ───────────────────────────────────────────────────
  if (role === "02") {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const [allRes, activeRes, pppoeRes, packagesRes] = await Promise.all([
      getCustomers(0, 1),
      getCustomers(0, 1, { isActive: true }),
      getCustomers(0, 50, { custtype: "pppoe" }),
      getPackagesAction(),
    ]);

    const totalCustomers  = allRes.data?.totalElements ?? 0;
    const activeCustomers = activeRes.data?.totalElements ?? 0;
    const allPPPoE        = pppoeRes.success ? pppoeRes.data.content : [];
    const packages        = packagesRes.success ? packagesRes.data : [];

    const expiringCustomers = allPPPoE.filter((c: any) => {
      if (!c.expiryDate) return false;
      const expiry = new Date(c.expiryDate);
      const now = new Date();
      return expiry >= now && expiry <= thirtyDaysFromNow;
    });

    const revenuePotential = packages
      .filter((p) => p.activeStatus)
      .reduce((sum, p) => sum + p.price, 0);

    return (
      <div className="flex-1 p-8 pt-6">
        <ManagementDashboardShell
          totalCustomers={totalCustomers}
          activeCustomers={activeCustomers}
          pppoeCustomers={allPPPoE.length}
          packages={packages}
          expiringCustomers={expiringCustomers}
          revenuePotential={revenuePotential}
          greeting={`Welcome, ${session?.user?.fname ?? "Manager"}`}
        />
      </div>
    );
  }

  // ── Staff (03) ────────────────────────────────────────────────────────
  if (role === "03") {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const [allRes, activeRes, pppoeRes, recentRes] = await Promise.all([
      getCustomers(0, 1),
      getCustomers(0, 1, { isActive: true }),
      getCustomers(0, 50, { custtype: "pppoe" }),
      getCustomers(0, 10),
    ]);

    const totalCustomers  = allRes.data?.totalElements ?? 0;
    const activeCustomers = activeRes.data?.totalElements ?? 0;
    const allPPPoE        = pppoeRes.success ? pppoeRes.data.content : [];
    const recentCustomers = recentRes.success ? recentRes.data.content : [];

    const urgentRenewals = allPPPoE.filter((c: any) => {
      if (!c.expiryDate) return false;
      const expiry = new Date(c.expiryDate);
      const now = new Date();
      return expiry >= now && expiry <= sevenDaysFromNow;
    });

    return (
      <div className="flex-1 p-8 pt-6">
        <StaffDashboardShell
          totalCustomers={totalCustomers}
          activeCustomers={activeCustomers}
          urgentRenewals={urgentRenewals}
          recentCustomers={recentCustomers}
          greeting={`Good day, ${session?.user?.fname ?? "Staff"}!`}
        />
      </div>
    );
  }

  // ── Customer (04) ─────────────────────────────────────────────────────
  if (role === "04") {
    const customerId = parseInt(session?.user?.id ?? "");
    if (isNaN(customerId)) notFound();

    const response = await getCustomerById(customerId);
    if (!response.success || !response.data) notFound();

    return (
      <div className="flex-1 p-8 pt-6">
        <CustomerDashboardShell customer={response.data} />
      </div>
    );
  }

  // Unknown role — fall through to 404
  notFound();
}
