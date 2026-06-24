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
      getCustomers(0, 1) ?? { data: { totalElements: 0 } },
      getCustomers(0, 1, { isActive: true }) ?? { data: { totalElements: 0 } },
      getCustomers(0, 1, { custtype: "pppoe" }) ?? { data: { totalElements: 0 } },
      getPackagesAction(),
      getMikrotikDevices(),
    ]);

    const totalCustomers   = allRes.data?.totalElements ?? 0;
    const activeCustomers  = activeRes.data?.totalElements ?? 0;
    const pppoeCustomers   = pppoeRes.data?.totalElements ?? 0;
    const allPackages      = packagesRes.success ? (packagesRes.data ?? []) : [];
    const activePackages   = allPackages.filter((p) => p.activeStatus).length;
    const allDevices       = devicesRes.success ? (devicesRes.data ?? []) : [];
    const onlineDevices    = allDevices.filter((d) => d.online).length;
/**
 * Revenue Calculations
 */
const monthlyRevenue = allPackages.reduce(
  (sum, pkg) =>
    sum + (Number(pkg?.price) || 0),
  0
);

const activeRevenue = allPackages
  .filter((pkg) =>
    Boolean(pkg?.activeStatus)
  )
  .reduce(
    (sum, pkg) =>
      sum + (Number(pkg?.price) || 0),
    0
  );

const inactiveRevenue = Math.max(
  monthlyRevenue - activeRevenue,
  0
);
    return (
      <div className="flex-1 p-8 pt-6">
       <DashboardShell
  metrics={{
    totalCustomers,
    activeCustomers,

    inactiveCustomers: Math.max(
      totalCustomers - activeCustomers,
      0
    ),

    pppoeCustomers,

    totalPackages: allPackages.length,

    activePackages,

    inactivePackages: Math.max(
      allPackages.length - activePackages,
      0
    ),

    totalDevices: allDevices.length,

    onlineDevices,

    offlineDevices: Math.max(
      allDevices.length - onlineDevices,
      0
    ),

    healthyRouters: onlineDevices,

    /**
     * Revenue
     */
    dailyRevenue: 18500,

    weeklyRevenue: 124000,

    monthlyRevenue,

    activeRevenue,

    inactiveRevenue,

    expectedRevenue:
      monthlyRevenue + 148000,

    collectedRevenue: 620000,

    outstandingBalances: 148000,

    failedPayments: 17,

    revenueGrowth: 12.4,

    arpu:
      activeCustomers > 0
        ? Number(
            (
              activeRevenue /
              activeCustomers
            ).toFixed(2)
          )
        : 0,

    hotspotRevenue: 87000,

    pppoeRevenue: Math.max(
      activeRevenue - 87000,
      0
    ),

    suspendedRevenueLoss: 23000,

    /**
     * Alerts
     */
    offlineRouters: Math.max(
      allDevices.length - onlineDevices,
      0
    ),

    highCpuRouters: 2,

    highMemoryRouters: 1,

    expiringCustomers: 14,

    expiredAccounts: 8,

    failedPPPoESessions: 5,

    failedHotspotSessions: 3,

    networkCongestionAlerts: 2,

    slaBreaches: 1,

    failedPaymentCallbacks: 4,

    smsFailures: 6,

    fraudAlerts: 0,

    bandwidthAlerts: 3,

    /**
     * Operations
     */
    activePPPoESessions: 412,

    activeHotspotSessions: 186,

    currentBandwidthUsage: 518,

    peakHourUsage: 842,

    uptimePercentage: 99.92,

    customerGrowth: 9.4,

    churnRate: 2.1,

    supportTickets: 11,
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
    const packages        = packagesRes.success ? (packagesRes.data ?? []) : [];

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
