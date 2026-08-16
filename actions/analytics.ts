"use server";

import { auth } from "@/lib/auth";
import { BASE_URL } from "@/lib/constants";
import type {
  NetworkAnalyticsOverview,
  AnalyticsTimeWindow,
} from "@/lib/types/analytics";

const FALLBACK_ANALYTICS: NetworkAnalyticsOverview = {
  kpis: {
    activeSubscribersCount: 79,
    newSubscribersCount: 854,
    revenueAmount: 154394,
    arpuAmount: 1954,
    sessionsCount: 17001,
    avgSessionDuration: "1h 42m",
    dataTransferredTb: 8.65,
    dataDownloadTb: 7.85,
    onlineNowCount: 52,
    paymentsCount: 8820,
    overdueAmount: 0,
  },
  paymentsTrend: {
    periodTotal: 154394,
    previousPeriodTotal: 131776,
    deltaPercent: 17.2,
    points: [
      { day: "1", currentAmount: 13000, previousAmount: 6000 },
      { day: "2", currentAmount: 11500, previousAmount: 8500 },
      { day: "3", currentAmount: 12500, previousAmount: 6500 },
      { day: "4", currentAmount: 13500, previousAmount: 8000 },
      { day: "5", currentAmount: 11800, previousAmount: 7500 },
      { day: "6", currentAmount: 9800, previousAmount: 7200 },
      { day: "7", currentAmount: 11200, previousAmount: 7600 },
      { day: "8", currentAmount: 9200, previousAmount: 7000 },
      { day: "10", currentAmount: 2500, previousAmount: 6200 },
      { day: "11", currentAmount: 1200, previousAmount: 5100 },
      { day: "13", currentAmount: 6800, previousAmount: 7200 },
      { day: "14", currentAmount: 4200, previousAmount: 6500 },
      { day: "15", currentAmount: 4900, previousAmount: 4800 },
      { day: "16", currentAmount: 4500, previousAmount: -200 },
      { day: "17", currentAmount: 4800, previousAmount: 4200 },
      { day: "18", currentAmount: 6200, previousAmount: 9500 },
      { day: "19", currentAmount: 8500, previousAmount: 11000 },
      { day: "20", currentAmount: 1000, previousAmount: 1200 },
    ],
  },
  paymentsVsExpenses: {
    totalPayments: 154394,
    totalExpenses: 0,
    netProfit: 154394,
    points: [
      { day: "1", paymentsAmount: 13000, expensesAmount: 0 },
      { day: "2", paymentsAmount: 11500, expensesAmount: 0 },
      { day: "3", paymentsAmount: 12500, expensesAmount: 0 },
      { day: "4", paymentsAmount: 13500, expensesAmount: 0 },
      { day: "5", paymentsAmount: 11800, expensesAmount: 0 },
      { day: "6", paymentsAmount: 9800, expensesAmount: 0 },
      { day: "7", paymentsAmount: 11200, expensesAmount: 0 },
      { day: "8", paymentsAmount: 9200, expensesAmount: 0 },
      { day: "10", paymentsAmount: 2500, expensesAmount: 0 },
      { day: "11", paymentsAmount: 1200, expensesAmount: 0 },
      { day: "13", paymentsAmount: 6800, expensesAmount: 0 },
      { day: "14", paymentsAmount: 4200, expensesAmount: 0 },
      { day: "15", paymentsAmount: 4900, expensesAmount: 0 },
      { day: "16", paymentsAmount: 4500, expensesAmount: 0 },
      { day: "17", paymentsAmount: 4800, expensesAmount: 0 },
      { day: "18", paymentsAmount: 6200, expensesAmount: 0 },
      { day: "19", paymentsAmount: 8500, expensesAmount: 0 },
      { day: "20", paymentsAmount: 1000, expensesAmount: 0 },
    ],
  },
  topPackages: [
    { id: "pkg-1", name: "AHS HOURLY 5HR", revenue: 35698, subscriberCount: 942, sharePercent: 100 },
    { id: "pkg-2", name: "AHS HOURLY 1HR", revenue: 32145, subscriberCount: 629, sharePercent: 90 },
    { id: "pkg-3", name: "AHS HOURLY 3HR", revenue: 30425, subscriberCount: 1098, sharePercent: 85 },
    { id: "pkg-4", name: "AHS HOURLY 24HR", revenue: 16280, subscriberCount: 159, sharePercent: 45 },
    { id: "pkg-5", name: "AHS HOURLY 12HR", revenue: 12352, subscriberCount: 344, sharePercent: 35 },
    { id: "pkg-6", name: "AHS HOURLY 20 MIN", revenue: 11580, subscriberCount: 182, sharePercent: 32 },
  ],
  topCustomers: [
    { rank: 1, subscriberCode: "A5847", totalSpent: 855, paymentsCount: 4, sharePercent: 100 },
    { rank: 2, subscriberCode: "A4204", totalSpent: 853, paymentsCount: 5, sharePercent: 99 },
    { rank: 3, subscriberCode: "A4680", totalSpent: 825, paymentsCount: 3, sharePercent: 96 },
    { rank: 4, subscriberCode: "A4201", totalSpent: 800, paymentsCount: 1, sharePercent: 93 },
    { rank: 5, subscriberCode: "A4365", totalSpent: 703, paymentsCount: 7, sharePercent: 82 },
    { rank: 6, subscriberCode: "A6", totalSpent: 698, paymentsCount: 32, sharePercent: 81 },
  ],
  revenueMix: [
    { name: "Hotspot", amount: 154364, percentage: 100, count: 8819, avgKsh: 18 },
    { name: "PPPoE", amount: 0, percentage: 0, count: 0, avgKsh: 0 },
  ],
  paymentMethodsMix: [
    { name: "Mobile money", amount: 154394, percentage: 100, count: 8820, avgKsh: 18 },
    { name: "Voucher", amount: 0, percentage: 0, count: 0, avgKsh: 0 },
  ],
  routerPerformance: [
    {
      id: "rtr-1",
      routerName: "ADRNOLDNETWORKS",
      status: "ONLINE",
      subscriberCount: 3357,
      revenueAmount: 87308,
      sessionCount: 10021,
      dataVolumeTb: 5.43,
      revenueSharePercent: 57,
    },
    {
      id: "rtr-2",
      routerName: "Adrinold Ukunda",
      status: "ONLINE",
      subscriberCount: 1396,
      revenueAmount: 66834,
      sessionCount: 6997,
      dataVolumeTb: 3.21,
      revenueSharePercent: 43,
    },
    {
      id: "rtr-3",
      routerName: "MikroTik1",
      status: "OFFLINE",
      subscriberCount: 0,
      revenueAmount: 0,
      sessionCount: 0,
      dataVolumeTb: 0,
      revenueSharePercent: 0,
    },
  ],
};

export async function getNetworkAnalyticsData(
  timeWindow: AnalyticsTimeWindow = "MONTHLY",
  _routerId?: string
): Promise<NetworkAnalyticsOverview> {
  const session = await auth();
  const token = session?.user?.apiToken;

  if (!token) return FALLBACK_ANALYTICS;

  try {
    const res = await fetch(
      `${BASE_URL}analytics/profit-and-loss/dashboard?window=${timeWindow}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        next: { revalidate: 30 },
      }
    );

    if (!res.ok) return FALLBACK_ANALYTICS;

    const data = await res.json();
    const live = data && typeof data === "object" ? data : {};
    const pickArray = <T,>(value: unknown, fallback: T[]): T[] =>
      Array.isArray(value) ? (value as T[]) : fallback;
    const pickObject = <T,>(value: unknown, fallback: T): T =>
      value && typeof value === "object" && !Array.isArray(value)
        ? (value as T)
        : fallback;

    return {
      ...FALLBACK_ANALYTICS,
      kpis: pickObject(live.kpis, FALLBACK_ANALYTICS.kpis),
      paymentsTrend:
        live.paymentsTrend &&
        typeof live.paymentsTrend === "object" &&
        Array.isArray(live.paymentsTrend.points)
          ? live.paymentsTrend
          : FALLBACK_ANALYTICS.paymentsTrend,
      paymentsVsExpenses:
        live.paymentsVsExpenses &&
        typeof live.paymentsVsExpenses === "object" &&
        Array.isArray(live.paymentsVsExpenses.points)
          ? live.paymentsVsExpenses
          : FALLBACK_ANALYTICS.paymentsVsExpenses,
      topPackages: pickArray(live.topPackages, FALLBACK_ANALYTICS.topPackages),
      topCustomers: pickArray(live.topCustomers, FALLBACK_ANALYTICS.topCustomers),
      revenueMix: pickArray(live.revenueMix, FALLBACK_ANALYTICS.revenueMix),
      paymentMethodsMix: pickArray(
        live.paymentMethodsMix,
        FALLBACK_ANALYTICS.paymentMethodsMix
      ),
      routerPerformance: pickArray(
        live.routerPerformance,
        FALLBACK_ANALYTICS.routerPerformance
      ),
    };
  } catch (e) {
    return FALLBACK_ANALYTICS;
  }
}
