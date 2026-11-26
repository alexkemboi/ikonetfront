/**
 * A PPPoE subscription running out within two days, as the operations cockpit sends it.
 * The card once read fields the backend never sent (subscriberCode, countdown): it crashed the
 * whole overview the first time the list was not empty (4 Nov).
 */
export interface RenewalDueItem {
  accountUsername?: string | null;
  phoneMasked?: string | null;
  /** Last day of service, YYYY-MM-DD (Nairobi); the subscription runs to the end of it. */
  expiryDate?: string | null;
  amount?: number | null;
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
  type: "EXPIRY" | "SMS_CREDIT" | "UNRECONCILED_PAYMENT" | "OUTAGE" | "SYSTEM_FEE";
  title: string;
  description: string;
  isUrgent: boolean;
  /** The backend's name for isUrgent (a Java boolean "isUrgent" is sent as "urgent"); read once in getDashboardOverview. */
  urgent?: boolean;
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
  companyName: string;
  shiftName: string; // e.g. "MORNING SHIFT"
  onlineSubscribersCount: number;
  expiriesDue24hCount: number;
  smsCreditLow: boolean;
  lastHourTrafficGb: number;

  // KPI Cards
  revenueToday: number;
  /** Today so far against yesterday up to the same time of day; null when yesterday had no revenue by then. */
  revenueTodayChangePercent: number | null;
  mobileMoneyRevenueToday: number;
  /** Currently valid PPPoE subscriptions. */
  activeSubscriptionsCount: number;
  /** Per-service split of onlineSubscribersCount; null/absent when the backend could not read it. */
  onlineHotspotCount?: number | null;
  onlinePppoeCount?: number | null;
  onlineTvCount?: number | null;
  /** PPPoE online ÷ active PPPoE subscriptions, 0..100. */
  onlinePercentage: number;
  smsCreditsCount: number | null;

  // Live Ticker
  liveTicker: LivePaymentTicker;

  // Actionable Widgets
  renewalsDue: RenewalDueItem[];
  routerTraffic: RouterTrafficItem[];
  whatsNextQueue: WhatsNextItem[];
  heatmap: HeatmapSummary;
  todayEventsCount: number;
  /** Access points reporting / not reporting, as on the routers page; null/absent when unavailable. */
  accessPointsSeenCount?: number | null;
  accessPointsNotSeenCount?: number | null;
  /** MikroTik routers online (healthy or degraded) out of all; null/absent when unavailable. */
  mikrotikOnlineCount?: number | null;
  mikrotikTotalCount?: number | null;
  /** Customers that have ever connected: PPPoE accounts, TV and hotspot devices; null/absent when unavailable. */
  customersPppoeCount?: number | null;
  customersTvCount?: number | null;
  customersHotspotCount?: number | null;
  /** Companies on the platform (all, and active), the platform entity left out; null/absent outside the platform-wide view. */
  companiesCount?: number | null;
  companiesActiveCount?: number | null;
  todayRecentPayments: {
    id: string;
    amount: number;
    account: string;
    timeAgo: string;
  }[];
}

export interface AdminDashboardResponse {
  dataStatus: "COMPLETE" | "PARTIAL";
  unavailableMetrics: Array<{ metric: string; reason: string }>;
  generatedAt: string;
  companyId: string | null;
  period: {
    from: string;
    to: string;
    timezone: "Africa/Nairobi";
    currency: "KES";
    daily: { from: string; to: string };
    weekly: { from: string; to: string };
    monthly: { from: string; to: string };
  };
  customers: { total: number; active: number; inactive: number; pppoe: number | null } | null;
  packages: { total: number; active: number; inactive: number | null } | null;
  devices: { total: number; online: number; offline: number; healthyRouters: number; degraded: number | null; notProvisioned: number | null } | null;
  revenue: {
    daily: string; weekly: string; monthly: string; active: string | null; inactive: string | null;
    expected: string; collected: string; outstanding: string; failedPayments: number;
    hotspot: string; pppoe: string; tv: string; suspendedRevenueLoss: string | null; currency: "KES";
  } | null;
  alerts: Record<string, number | null> | null;
  operations: Record<string, number | null> | null;
  revenueTrend: Array<{ period: string; revenue: string; collected: string }>;
  subscriberGrowth: Array<{ period: string; subscriberCount: number }>;
}

export type AdminDashboardLoadResult =
  | { success: true; data: AdminDashboardResponse; requestId?: string }
  | { success: false; message: string; requestId?: string };