export interface RenewalDueItem {
  id: string;
  subscriberCode: string;
  phoneMasked: string;
  expiresInSeconds: number;
  formattedCountdown: string; // e.g. "22s from now", "3m 40s from now"
}

export interface RouterTrafficItem {
  id: string;
  routerName: string;
  activeSessions: number;
  dataTransferredGb: number;
  trafficSharePercent: number; // e.g. 62
}

export interface WhatsNextItem {
  id: string;
  type: "EXPIRY" | "SMS_CREDIT" | "UNRECONCILED_PAYMENT" | "OUTAGE";
  title: string;
  description: string;
  isUrgent: boolean;
  actionUrl: string;
}

export interface HeatmapCell {
  dayOfWeek: number; // 0 = Sun, 1 = Mon ... 6 = Sat
  hourOfDay: number; // 0 to 23
  volumeGb: number;
  intensity: number; // 0 (quiet) to 4 (peak amber)
}

export interface HeatmapSummary {
  peakHour: string; // "Sun 19:00 · 76.4 GB"
  quietestHour: string; // "Mon 13:00 · 0 B"
  weekdayAvgGb: string; // "7.7 GB"
  weekendAvgGb: string; // "22.3 GB"
  cells: HeatmapCell[];
}

export interface LivePaymentTicker {
  amount: number;
  account: string;
  timeAgo: string;
  healthyRouters: number;
  totalRouters: number;
}

export interface DashboardOverviewData {
  tenantName: string;
  shiftName: string; // e.g. "MORNING SHIFT"
  onlineSubscribersCount: number;
  expiriesDue24hCount: number;
  smsCreditLow: boolean;
  lastHourTrafficGb: number;

  // KPI Cards
  revenueToday: number;
  revenueTodayChangePercent: number;
  mobileMoneyRevenueToday: number;
  activeSubscriptionsCount: number;
  onlinePercentage: number;
  smsCreditsCount: number;

  // Live Ticker
  liveTicker: LivePaymentTicker;

  // Actionable Widgets
  renewalsDue: RenewalDueItem[];
  routerTraffic: RouterTrafficItem[];
  whatsNextQueue: WhatsNextItem[];
  heatmap: HeatmapSummary;
  todayEventsCount: number;
  todayRecentPayments: {
    id: string;
    amount: number;
    account: string;
    timeAgo: string;
  }[];
}