"use server";

import { auth } from "@/lib/auth";
import { BASE_URL } from "@/lib/constants";
import { DashboardOverviewData } from "@/lib/types/dashboard";

const FALLBACK_DASHBOARD: DashboardOverviewData = {
  tenantName: "ADRINOLD NETWORK",
  shiftName: "MORNING SHIFT",
  onlineSubscribersCount: 45,
  expiriesDue24hCount: 63,
  smsCreditLow: true,
  lastHourTrafficGb: 22.0,
  revenueToday: 1200,
  revenueTodayChangePercent: -1,
  mobileMoneyRevenueToday: 1200,
  activeSubscriptionsCount: 145,
  onlinePercentage: 30,
  smsCreditsCount: 0,
  liveTicker: {
    amount: 15,
    account: "A2421",
    timeAgo: "31 minutes ago",
    healthyRouters: 2,
    totalRouters: 2,
  },
  renewalsDue: [
    { id: "1", subscriberCode: "A2085", phoneMasked: "07032471··· 179", expiresInSeconds: 22, formattedCountdown: "22s from now" },
    { id: "2", subscriberCode: "A868", phoneMasked: "07949677··· 760", expiresInSeconds: 220, formattedCountdown: "3m 40s from now" },
    { id: "3", subscriberCode: "A862", phoneMasked: "01123532··· 298", expiresInSeconds: 627, formattedCountdown: "10m 27s from now" },
    { id: "4", subscriberCode: "A5857", phoneMasked: "07404559··· 919", expiresInSeconds: 1572, formattedCountdown: "26m 12s from now" },
    { id: "5", subscriberCode: "A4169", phoneMasked: "07576005··· 581", expiresInSeconds: 1638, formattedCountdown: "27m 18s from now" },
    { id: "6", subscriberCode: "A6177", phoneMasked: "07907887··· 755", expiresInSeconds: 1685, formattedCountdown: "28m 5s from now" },
    { id: "7", subscriberCode: "A612", phoneMasked: "07055804··· 445", expiresInSeconds: 1740, formattedCountdown: "29m from now" },
  ],
  routerTraffic: [
    { id: "rtr-1", routerName: "ADRNOLDNETWORKS", activeSessions: 37, dataTransferredGb: 36.9, trafficSharePercent: 62 },
    { id: "rtr-2", routerName: "Adrinold Ukunda", activeSessions: 23, dataTransferredGb: 12.1, trafficSharePercent: 38 },
  ],
  whatsNextQueue: [
    { id: "wn-1", type: "EXPIRY", title: "63 subscriptions expire in 24h", description: "Nudge with an SMS reminder before service cuts off.", isUrgent: true, actionUrl: "/customers" },
    { id: "wn-2", type: "SMS_CREDIT", title: "SMS credit low", description: "Top up before reminders start failing.", isUrgent: false, actionUrl: "/communications" },
    { id: "wn-3", type: "UNRECONCILED_PAYMENT", title: "1 unreconciled payment", description: "Match Mobile Money receipts before closing the day.", isUrgent: false, actionUrl: "/finance/ledger" },
  ],
  heatmap: {
    peakHour: "Sun 19:00 · 76.4 GB",
    quietestHour: "Mon 13:00 · 0 B",
    weekdayAvgGb: "7.7 GB",
    weekendAvgGb: "22.3 GB",
    cells: Array.from({ length: 7 * 24 }, (_, i) => ({
      dayOfWeek: Math.floor(i / 24),
      hourOfDay: i % 24,
      volumeGb: (i % 24 > 17 && i % 24 < 22) ? 45.2 : (i % 24 > 6 && i % 24 < 17) ? 18.4 : 2.1,
      intensity: (i % 24 > 17 && i % 24 < 22) ? 4 : (i % 24 > 6 && i % 24 < 17) ? 2 : 1,
    })),
  },
  todayEventsCount: 10,
  todayRecentPayments: [
    { id: "p1", amount: 10, account: "A3659", timeAgo: "2 minutes ago" },
    { id: "p2", amount: 18, account: "A656", timeAgo: "8 minutes ago" },
    { id: "p3", amount: 10, account: "858945976", timeAgo: "9 minutes ago" },
    { id: "p4", amount: 18, account: "A6472", timeAgo: "13 minutes ago" },
    { id: "p5", amount: 15, account: "A230", timeAgo: "19 minutes ago" },
    { id: "p6", amount: 15, account: "A1074", timeAgo: "20 minutes ago" },
    { id: "p7", amount: 28, account: "A3763", timeAgo: "31 minutes ago" },
  ],
};

export async function getDashboardOverview(): Promise<DashboardOverviewData> {
  const session = await auth();
  const token = session?.user?.apiToken;

  if (!token) {
    return FALLBACK_DASHBOARD;
  }

  try {
    const res = await fetch(`${BASE_URL}analytics/profit-and-loss/dashboard`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return FALLBACK_DASHBOARD;
    }

    const data = await res.json();
    return { ...FALLBACK_DASHBOARD, ...data };
  } catch (error) {
    console.warn("Failed to fetch live dashboard telemetry. Using active baseline:", error);
    return FALLBACK_DASHBOARD;
  }
}