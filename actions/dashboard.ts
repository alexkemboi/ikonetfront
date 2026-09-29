"use server";

import { auth } from "@/lib/auth";
import { buildApiUrl } from "@/lib/constants";
import { DashboardOverviewData } from "@/lib/types/dashboard";
import { apiFetch } from "@/lib/apiClient";
import type { AdminDashboardLoadResult, AdminDashboardResponse } from "@/lib/types/dashboard";

export async function getAdminDashboardData(): Promise<AdminDashboardLoadResult> {
  const res = await apiFetch<AdminDashboardResponse>("/dashboard/admin", {
    auth: "required",
    cache: "no-store",
  });
  if (!res.success || !res.data) {
    return { success: false, message: res.message, requestId: res.requestId };
  }
  return { success: true, data: res.data, requestId: res.requestId };
}

const EMPTY_DASHBOARD: DashboardOverviewData = {
  companyName: "",
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
    const res = await fetch(buildApiUrl("/dashboard/operations-cockpit"), {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return EMPTY_DASHBOARD;
    }

    const data = (await res.json()) as { data?: Partial<DashboardOverviewData> & { tenantName?: string; companyName?: string } };
    if (!data.data) {
      return EMPTY_DASHBOARD;
    }

    return {
      ...EMPTY_DASHBOARD,
      ...data.data,
      companyName: data.data.companyName ?? data.data.tenantName ?? "",
    };
  } catch (error) {
    console.warn("Failed to fetch live dashboard telemetry. Returning empty state:", error);
    return EMPTY_DASHBOARD;
  }
}
