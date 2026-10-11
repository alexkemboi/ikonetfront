/**
 * Analytics report contract (backend: com.ikonex.ibs_api.analytics.report.AnalyticsReport).
 *
 * Money is a decimal string in `context.currency`; percentages are decimal strings where
 * "0.21" means 0.21%; traffic is whole bytes; durations are seconds. `null` means "not
 * measured" and comes with the panel's status; 0 is always a measured zero.
 */

export type AnalyticsPeriod = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | "LAST_YEAR" | "CUSTOM";
export type AnalyticsService = "ALL" | "HOTSPOT" | "PPPOE";
export type AnalyticsInterval = "HOUR" | "DAY" | "WEEK" | "MONTH";
export type Comparison = "UP" | "DOWN" | "FLAT" | "NO_PREVIOUS";

/** Every filter as the backend applied it. */
export interface AnalyticsContext {
  companyId: string | null;
  routerId: number | null;
  routerName: string | null;
  service: AnalyticsService;
  period: AnalyticsPeriod;
  from: string;
  to: string;
  previousFrom: string;
  previousTo: string;
  timezone: string;
  currency: string;
  interval: AnalyticsInterval;
  generatedAt: string;
}

/** AVAILABLE: data is set (an empty list means nothing qualified). Otherwise data is null. */
export interface Panel<T> {
  status: "AVAILABLE" | "UNAVAILABLE" | "NOT_CONFIGURED";
  reason: string | null;
  message: string | null;
  data: T | null;
}

interface Section {
  context: AnalyticsContext;
  dataStatus: "COMPLETE" | "PARTIAL";
  unavailableMetrics: Array<{ metric: string; reason: string }>;
}

// ---------------------------------------------------------------- summary

export interface AnalyticsKpis {
  activeSubscribers: Panel<{ count: number; newInPeriod: number }>;
  revenue: Panel<{ amount: string; currency: string }>;
  arpu: Panel<{ amount: string | null; currency: string; windowDays: number; payingSubscribers: number }>;
  sessions: Panel<{ count: number; averageDurationSeconds: number | null }>;
  dataUsage: Panel<DataUsage>;
  onlineNow: Panel<{ openSessionCount: number; asOf: string; refreshSeconds: number }>;
  payments: Panel<{ count: number }>;
  overdue: Panel<{ amount: string; currency: string; invoiceCount: number; asOf: string }>;
}

export interface DataUsage {
  totalBytes: number;
  downloadBytes: number;
  uploadBytes: number;
}

export interface MoneyPoint {
  bucketStart: string;
  label: string;
  currentAmount: string;
  previousBucketStart: string | null;
  previousAmount: string;
  /** null unless the service filter is ALL */
  expenseAmount: string | null;
  paymentCount: number;
}

export interface PaymentsTrend {
  currentTotal: string;
  previousTotal: string;
  expenseTotal: string | null;
  netTotal: string | null;
  deltaPercent: string | null;
  comparison: Comparison;
  paymentCount: number;
  expensesIncluded: boolean;
  currency: string;
  interval: AnalyticsInterval;
  points: MoneyPoint[];
}

export interface AnalyticsSummary extends Section {
  kpis: AnalyticsKpis;
  paymentsTrend: Panel<PaymentsTrend>;
}

// ---------------------------------------------------------------- revenue

export interface Ranking<T> {
  rows: T[];
  limit: number;
}

export interface RankedPackage {
  rank: number;
  packageId: string | null;
  packageName: string;
  service: string;
  amount: string;
  currency: string;
  subscribers: number;
  paymentCount: number;
  sharePercent: string;
}

export interface RankedCustomer {
  rank: number;
  customerId: string;
  customerName: string;
  service: string;
  /** never a full number */
  maskedPhone: string | null;
  amount: string;
  currency: string;
  paymentCount: number;
}

export interface MixRow {
  code: string;
  label: string;
  amount: string;
  sharePercent: string;
  count: number;
  averageAmount: string | null;
}

export interface Mix {
  totalAmount: string;
  currency: string;
  rows: MixRow[];
}

export interface FailedMpesa {
  notPaidAmount: string;
  currency: string;
  failedCount: number;
  /** every prompt sent in the period; 0 means none was sent */
  promptCount: number;
  outcomes: Array<{ code: string; label: string; count: number; amount: string }>;
}

/** 7 x 24 grid, every cell present: isoWeekday 1 (Monday) to 7, hour 0 to 23. */
export interface Heatmap {
  cells: Array<{ isoWeekday: number; hour: number; count: number }>;
  max: number;
  total: number;
  sampleCount: number;
  minimumSamples: number;
  sufficient: boolean;
}

export interface AnalyticsRevenue extends Section {
  topPackages: Panel<Ranking<RankedPackage>>;
  topCustomers: Panel<Ranking<RankedCustomer>>;
  revenueMix: Panel<Mix>;
  paymentMethods: Panel<Mix>;
  failedMpesa: Panel<FailedMpesa>;
  paymentTimes: Panel<Heatmap>;
}

// ------------------------------------------------------------ subscribers

export interface CountPoint {
  bucketStart: string;
  label: string;
  current: number;
  previousBucketStart: string | null;
  previous: number;
}

export interface CountTrend {
  currentTotal: number;
  previousTotal: number;
  deltaPercent: string | null;
  comparison: Comparison;
  peak: number | null;
  interval: AnalyticsInterval;
  points: CountPoint[];
}

export interface Breakdown {
  total: number;
  asOf: string;
  rows: Array<{ code: string; label: string; count: number }>;
}

export interface AnalyticsSubscribers extends Section {
  newSubscribers: Panel<CountTrend>;
  byType: Panel<Breakdown>;
  lifecycle: Panel<Breakdown>;
  expiringSoon: Panel<{ within7Days: number; within14Days: number; within30Days: number; cumulative: boolean; asOf: string }>;
  renewalRate: Panel<{ expiredPlans: number; renewedPlans: number; ratePercent: string | null; buckets: Array<{ code: string; label: string; count: number }> }>;
  repeatBuyers: Panel<{ payingCustomers: number; repeatCustomers: number; repeatPercent: string | null; purchasesPerCustomer: string | null; spendPerCustomer: string | null; currency: string }>;
}

// ---------------------------------------------------------------- network

export interface BytesTrend {
  currentBytes: number;
  previousBytes: number;
  deltaPercent: string | null;
  comparison: Comparison;
  interval: AnalyticsInterval;
  points: Array<{ bucketStart: string; label: string; currentBytes: number; previousBucketStart: string | null; previousBytes: number }>;
}

export interface PlanUsageRow {
  rank: number;
  planId: string | null;
  planName: string;
  service: string;
  bytes: number;
  previousBytes: number | null;
  deltaPercent: string | null;
}

export interface TalkerRow {
  rank: number;
  userId: string;
  userName: string;
  service: string;
  routerName: string | null;
  bytes: number;
  sessions: number;
}

export interface Downtime {
  totalSeconds: number;
  routers: Array<{ routerIdxno: number; routerId: number | null; routerName: string; downtimeSeconds: number; outageCount: number; ongoing: boolean }>;
}

export interface AnalyticsNetwork extends Section {
  activeSessions: Panel<CountTrend>;
  dataUsage: Panel<BytesTrend>;
  uploadDownload: Panel<DataUsage>;
  usageByPlan: Panel<Ranking<PlanUsageRow>>;
  topTalkers: Panel<Ranking<TalkerRow>>;
  trafficHeatmap: Panel<Heatmap>;
  routerDowntime: Panel<Downtime>;
}

// ---------------------------------------------------------------- routers

export interface RouterPerformanceRow {
  routerId: number;
  routerName: string;
  status: "ONLINE" | "OFFLINE" | "UNKNOWN";
  lastSeenAt: string | null;
  subscriberCount: number;
  revenueAmount: string;
  currency: string;
  sessionCount: number;
  dataTransferredBytes: number;
  revenueSharePercent: string;
}

export interface AnalyticsRouters extends Section {
  performance: Panel<{ rows: RouterPerformanceRow[]; totalRevenue: string; unattributedRevenue: string | null; currency: string }>;
}

export interface RouterOption {
  routerId: number;
  routerName: string;
  status: "ONLINE" | "OFFLINE" | "UNKNOWN";
}

// ---------------------------------------------------------------- targets

export type TargetMetric = "REVENUE_COLLECTED" | "NEW_SUBSCRIBERS";

export interface AnalyticsTarget {
  targetId: string | null;
  metric: TargetMetric;
  month: string;
  routerId: number | null;
  /** null until a target is set */
  value: string | null;
  /** currency code for money, COUNT otherwise */
  unit: string;
  achieved: string;
  progressPercent: string | null;
  /** monthly average of the three months before */
  suggestedValue: string;
  updatedAt: string | null;
  updatedBy: string | null;
  editable: boolean;
}

export interface AnalyticsTargets {
  context: AnalyticsContext;
  month: string;
  targets: AnalyticsTarget[];
}

export type Loaded<T> =
  | { success: true; data: T; requestId?: string }
  | { success: false; message: string; requestId?: string };
