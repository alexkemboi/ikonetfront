import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getCustomers, getCustomerById } from "@/actions/customer";
import { getPackagesAction } from "@/actions/packages";
import { getMikrotikDevices } from "@/actions/mikrotik";
import { DashboardShell } from "./_components/DashboardShell";
import { ManagementDashboardShell } from "./_components/ManagementDashboardShell";
import { StaffDashboardShell } from "./_components/StaffDashboardShell";
import { CustomerDashboardShell } from "./_components/CustomerDashboardShell";
import { ROLE_NAME, normalizeRole } from "@/lib/types/roles";

export default async function DashboardPage() {
  const session = await auth();
  const role = normalizeRole(session?.user?.role);

  // ── Admin ─────────────────────────────────────────────────────────────
  if (role === ROLE_NAME.ADMIN) {
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
const monthlyRevenue = 0

const activeRevenue = 0

const inactiveRevenue = 0
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
    dailyRevenue: 0,

    weeklyRevenue: 0,

    monthlyRevenue,

    activeRevenue,

    inactiveRevenue,

    expectedRevenue:0,

    collectedRevenue: 0,

    outstandingBalances: 0,

    failedPayments: 0,

    revenueGrowth: 0,

    arpu:
      activeCustomers > 0
        ? Number(
            (
              activeRevenue /
              activeCustomers
            ).toFixed(2)
          )
        : 0,

    hotspotRevenue: 0,

    pppoeRevenue: Math.max(
      activeRevenue - 0,
      0
    ),

    suspendedRevenueLoss: 0,

    /**
     * Alerts
     */
    offlineRouters: Math.max(
      allDevices.length - onlineDevices,
      0
    ),

    highCpuRouters: 0,

    highMemoryRouters: 0,

    expiringCustomers: 0,

    expiredAccounts: 0,

    failedPPPoESessions: 0,

    failedHotspotSessions: 0,

    networkCongestionAlerts: 0,

    slaBreaches: 0,

    failedPaymentCallbacks: 0,

    smsFailures: 0 ,

    fraudAlerts: 0,

    bandwidthAlerts: 0,

    /**
     * Operations
     */
    activePPPoESessions: 0,

    activeHotspotSessions: 0,

    currentBandwidthUsage: 0,

    peakHourUsage: 0,

    uptimePercentage: 0,

    customerGrowth: 0,

    churnRate: 0,

    supportTickets: 0,
  }}
  devices={allDevices}
  packages={allPackages}
/>
      </div>
    );
  }

  // ── Management ───────────────────────────────────────────────────────
  if (role === ROLE_NAME.MANAGEMENT) {
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

  // ── Staff ────────────────────────────────────────────────────────────
  if (role === ROLE_NAME.STAFF) {
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

  // ── Customer ─────────────────────────────────────────────────────────
  if (role === ROLE_NAME.CUSTOMER) {
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
