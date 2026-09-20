"use server";

import { auth } from "@/lib/auth";
import { BASE_URL } from "@/lib/constants";
import { DashboardOverviewData } from "@/lib/types/dashboard";

const EMPTY_DASHBOARD: DashboardOverviewData = {
  tenantName: "",
  shiftName: "",
  onlineSubscribersCount: 0,
  expiriesDue24hCount: 0,
  smsCreditLow: false,
  lastHourTrafficGb: 0,
  revenueToday: 0,
  revenueTodayChangePercent: 0,
  mobileMoneyRevenueToday: 0,
  activeSubscriptionsCount: 0,
  onlinePercentage: 0,
  smsCreditsCount: null,
  liveTicker: {
    amount: 0,
    account: "",
    timeAgo: "",
    healthyRouters: 0,
    totalRouters: 0,
  },
  renewalsDue: [],
  routerTraffic: [],
  whatsNextQueue: [],
  heatmap: {
    peakHour: "",
    quietestHour: "",
    weekdayAvgGb: "",
    weekendAvgGb: "",
    cells: Array.from({ length: 7 * 24 }, () => ({
      dayOfWeek: 0,
      hourOfDay: 0,
      volumeGb: 0,
      intensity: 0,
    })),
  },
  todayEventsCount: 0,
  todayRecentPayments: [],
};

export async function getDashboardOverview(): Promise<DashboardOverviewData> {
  const session = await auth();
  const token = session?.user?.apiToken;

  if (!token) {
    return EMPTY_DASHBOARD;
  }

  try {
    const res = await fetch(`${BASE_URL}api/v1/dashboard/operations-cockpit`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return EMPTY_DASHBOARD;
    }

    const data = (await res.json()) as { data?: Partial<DashboardOverviewData> };
    if (!data.data) {
      return EMPTY_DASHBOARD;
    }

    return { ...EMPTY_DASHBOARD, ...data.data };
  } catch (error) {
    console.warn("Failed to fetch live dashboard telemetry. Returning empty state:", error);
    return EMPTY_DASHBOARD;
  }
}
