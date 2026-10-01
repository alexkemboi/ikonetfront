export type AnalyticsTimeWindow = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | "LAST_YEAR";

export interface AnalyticsDashboardData {
  dataStatus: "COMPLETE" | "PARTIAL";
  unavailableMetrics: Array<{ metric: string; reason: string }>;
  generatedAt: string;
  companyId: string | null;
  period: { from: string; to: string; previousFrom: string; previousTo: string; timezone: "Africa/Nairobi"; currency: "KES" };
  unattributedRevenue: string;
  kpis: {
    revenue30d: string | null;
    profit30d: string | null;
    marginPct: string | null;
    subscriberCount: number | null;
    activeSubscriptionCount: number | null;
    churnRate30d: string | null;
    topPackageName: string | null;
    arpu30d: string | null;
    avgDaysToPay: string | null;
    uncollectedInvoices30d: string | null;
    badDebtExpense30d: string | null;
    avgSessionDurationMinutes30d: number | null;
  };
  paymentsTrend: {
    periodTotal: string;
    previousPeriodTotal: string;
    deltaPercent: string | null;
    unit: "KES";
    interval: "DAY";
    points: Array<{ date: string; currentRevenue: string; previousDate: string; previousRevenue: string; paymentCount: number; revenue: string }>;
  };
  paymentsVsExpenses: {
    interval: "MONTH";
    points: Array<{ date: string; revenue: string; expense: string; profit: string }>;
  };
  revenueMix: Array<{ code: string; bucket: string; totalAmount: string; sharePct: number; count: number; averageAmount: string | null }>;
  paymentMethodsMix: Array<{ method: string; count: number; totalAmount: string; sharePct: number }>;
  topPackages: Array<{ packageId: number; packageName: string; revenue30d: string; newSubs30d: number; sharePct: number }>;
  topCustomers: Array<{ customerId: number; customerName: string; totalPaid: string; paymentCount: number }>;
  routerPerformance: Array<{
    routerId: number | null; deviceId: number | null; routerName: string; activeSessions: number;
    dataTransferredGb: string | null; healthScore: number | null; latencyMs: number | null;
    cpuUsage: number | null; freeMemory: number | null; totalMemory: number | null; snapshotAt: string | null;
    telemetryStatus: "LIVE" | "STALE" | "UNAVAILABLE"; telemetrySampledAt: string | null;
    revenueAmount: string | null; revenueSharePercent: string | null;
  }>;
}

export type AnalyticsLoadResult =
  | { success: true; data: AnalyticsDashboardData; requestId?: string }
  | { success: false; message: string; requestId?: string };
