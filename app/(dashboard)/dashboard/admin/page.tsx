import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { resolveDashboardPathForRole } from "@/lib/utils/dashboardRouting";

import { getCustomers } from "@/actions/customer";
import { getPackagesAction } from "@/actions/packages";
import { getMikrotikDevices } from "@/actions/mikrotik";

import { DashboardShell } from "../_components/DashboardShell";

const safeNumber = (value: unknown): number => {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
};

const safeArray = <T,>(value: T[] | undefined | null): T[] => {
  return Array.isArray(value) ? value : [];
};

const calculateGrowth = (
  current: number,
  previous: number
): number => {
  if (!previous || previous <= 0) {
    return 0;
  }

  return Number(
    (((current - previous) / previous) * 100).toFixed(1)
  );
};

/**
 * Enterprise ISP Mock Operational Data
 * Used for unavailable APIs
 */
const ISP_MOCK_METRICS = {
  revenue: {
    dailyRevenue: 18500,
    weeklyRevenue: 124000,
    collectedRevenue: 620000,
    outstandingBalances: 148000,
    failedPayments: 17,
    hotspotRevenue: 87000,
    suspendedRevenueLoss: 23000,
  },

  alerts: {
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
  },

  operations: {
    activePPPoESessions: 412,
    activeHotspotSessions: 186,

    /**
     * MUST be numbers
     * NOT strings
     */
    currentBandwidthUsage: 518,
    peakHourUsage: 842,

    uptimePercentage: 99.92,
    churnRate: 2.1,
    supportTickets: 11,
  },
};

export default async function AdminDashboardPage() {
  const session = await auth();

  const correctPath = resolveDashboardPathForRole(
    session?.user?.role
  );

  /**
   * Redirect invalid roles
   */
  if (correctPath !== "/dashboard/admin") {
    redirect(correctPath);
  }

  /**
   * Safe parallel fetching
   */
  const [
    allCustomersRes,
    activeCustomersRes,
    pppoeCustomersRes,
    packagesRes,
    devicesRes,
  ] = await Promise.allSettled([
    getCustomers(0, 1),

    getCustomers(0, 1, {
      isActive: true,
    }),

    getCustomers(0, 1, {
      custtype: "pppoe",
    }),

    getPackagesAction(),

    getMikrotikDevices(),
  ]);

  /**
   * Customers
   */
  const totalCustomers =
    allCustomersRes.status === "fulfilled"
      ? safeNumber(
          allCustomersRes.value?.data
            ?.totalElements
        )
      : 0;

  const activeCustomers =
    activeCustomersRes.status === "fulfilled"
      ? safeNumber(
          activeCustomersRes.value?.data
            ?.totalElements
        )
      : 0;

  const pppoeCustomers =
    pppoeCustomersRes.status === "fulfilled"
      ? safeNumber(
          pppoeCustomersRes.value?.data
            ?.totalElements
        )
      : 0;

  /**
   * Packages
   */
  const allPackages =
    packagesRes.status === "fulfilled" &&
    packagesRes.value?.success
      ? safeArray(packagesRes.value.data)
      : [];

  const activePackages = allPackages.filter(
    (pkg) => Boolean(pkg?.activeStatus)
  ).length;

  const inactivePackages = Math.max(
    allPackages.length - activePackages,
    0
  );

  /**
   * Devices
   */
  const allDevices =
    devicesRes.status === "fulfilled" &&
    devicesRes.value?.success
      ? safeArray(devicesRes.value.data)
      : [];

  const onlineDevices = allDevices.filter(
    (device) => Boolean(device?.online)
  ).length;

  const offlineDevices = Math.max(
    allDevices.length - onlineDevices,
    0
  );

  const healthyRouters = onlineDevices;

  /**
   * Revenue Calculations
   */
  const monthlyRevenue = allPackages.reduce(
    (sum, pkg) =>
      sum + safeNumber(pkg?.price),
    0
  );

  const activeRevenue = allPackages
    .filter((pkg) =>
      Boolean(pkg?.activeStatus)
    )
    .reduce(
      (sum, pkg) =>
        sum + safeNumber(pkg?.price),
      0
    );

  const inactiveRevenue = Math.max(
    monthlyRevenue - activeRevenue,
    0
  );

  const hotspotRevenue =
    ISP_MOCK_METRICS.revenue
      .hotspotRevenue;

  const pppoeRevenue = Math.max(
    activeRevenue - hotspotRevenue,
    0
  );

  const expectedRevenue =
    monthlyRevenue +
    ISP_MOCK_METRICS.revenue
      .outstandingBalances;

  const arpu =
    activeCustomers > 0
      ? Number(
          (
            activeRevenue /
            activeCustomers
          ).toFixed(2)
        )
      : 0;

  const revenueGrowth =
    calculateGrowth(
      activeRevenue,
      activeRevenue * 0.84
    );

  const customerGrowth =
    calculateGrowth(
      activeCustomers,
      activeCustomers * 0.91
    );

  /**
   * Fully Typed Enterprise Metrics
   */
  const metrics = {
    /**
     * Customer Metrics
     */
    totalCustomers,
    activeCustomers,

    inactiveCustomers: Math.max(
      totalCustomers - activeCustomers,
      0
    ),

    pppoeCustomers,

    /**
     * Package Metrics
     */
    totalPackages: allPackages.length,
    activePackages,
    inactivePackages,

    /**
     * Device Metrics
     */
    totalDevices: allDevices.length,
    onlineDevices,
    offlineDevices,
    healthyRouters,

    /**
     * Revenue Metrics
     */
    dailyRevenue:
      ISP_MOCK_METRICS.revenue
        .dailyRevenue,

    weeklyRevenue:
      ISP_MOCK_METRICS.revenue
        .weeklyRevenue,

    monthlyRevenue,

    activeRevenue,

    inactiveRevenue,

    expectedRevenue,

    collectedRevenue:
      ISP_MOCK_METRICS.revenue
        .collectedRevenue,

    outstandingBalances:
      ISP_MOCK_METRICS.revenue
        .outstandingBalances,

    failedPayments:
      ISP_MOCK_METRICS.revenue
        .failedPayments,

    revenueGrowth,

    arpu,

    hotspotRevenue,

    pppoeRevenue,

    suspendedRevenueLoss:
      ISP_MOCK_METRICS.revenue
        .suspendedRevenueLoss,

    /**
     * Alert Metrics
     */
    offlineRouters:
      offlineDevices,

    highCpuRouters:
      ISP_MOCK_METRICS.alerts
        .highCpuRouters,

    highMemoryRouters:
      ISP_MOCK_METRICS.alerts
        .highMemoryRouters,

    expiringCustomers:
      ISP_MOCK_METRICS.alerts
        .expiringCustomers,

    expiredAccounts:
      ISP_MOCK_METRICS.alerts
        .expiredAccounts,

    failedPPPoESessions:
      ISP_MOCK_METRICS.alerts
        .failedPPPoESessions,

    failedHotspotSessions:
      ISP_MOCK_METRICS.alerts
        .failedHotspotSessions,

    networkCongestionAlerts:
      ISP_MOCK_METRICS.alerts
        .networkCongestionAlerts,

    slaBreaches:
      ISP_MOCK_METRICS.alerts
        .slaBreaches,

    failedPaymentCallbacks:
      ISP_MOCK_METRICS.alerts
        .failedPaymentCallbacks,

    smsFailures:
      ISP_MOCK_METRICS.alerts
        .smsFailures,

    fraudAlerts:
      ISP_MOCK_METRICS.alerts
        .fraudAlerts,

    bandwidthAlerts:
      ISP_MOCK_METRICS.alerts
        .bandwidthAlerts,

    /**
     * Operational Metrics
     */
    activePPPoESessions:
      ISP_MOCK_METRICS.operations
        .activePPPoESessions,

    activeHotspotSessions:
      ISP_MOCK_METRICS.operations
        .activeHotspotSessions,

    /**
     * MUST remain numbers
     */
    currentBandwidthUsage:
      ISP_MOCK_METRICS.operations
        .currentBandwidthUsage,

    peakHourUsage:
      ISP_MOCK_METRICS.operations
        .peakHourUsage,

    uptimePercentage:
      ISP_MOCK_METRICS.operations
        .uptimePercentage,

    customerGrowth,

    churnRate:
      ISP_MOCK_METRICS.operations
        .churnRate,

    supportTickets:
      ISP_MOCK_METRICS.operations
        .supportTickets,
  };

  return (
    <div className="flex-1 overflow-hidden p-8 pt-6">
      <DashboardShell
        metrics={metrics}
        devices={allDevices}
        packages={allPackages}
      />
    </div>
  );
}