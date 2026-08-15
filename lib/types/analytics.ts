export type AnalyticsTimeWindow = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | "LAST_YEAR";

export interface AnalyticsKpis {
  activeSubscribersCount: number;
  newSubscribersCount: number;
  revenueAmount: number;
  arpuAmount: number;
  sessionsCount: number;
  avgSessionDuration: string;
  dataTransferredTb: number;
  dataDownloadTb: number;
  onlineNowCount: number;
  paymentsCount: number;
  overdueAmount: number;
}

export interface PaymentTrendPoint {
  day: string;
  currentAmount: number;
  previousAmount: number;
}

export interface PaymentsVsExpensesPoint {
  day: string;
  paymentsAmount: number;
  expensesAmount: number;
}

export interface TopPackageItem {
  id: string;
  name: string;
  revenue: number;
  subscriberCount: number;
  sharePercent: number;
}

export interface TopCustomerItem {
  rank: number;
  subscriberCode: string;
  totalSpent: number;
  paymentsCount: number;
  sharePercent: number;
}

export interface DonutSegment {
  name: string;
  amount: number;
  percentage: number;
  count: number;
  avgKsh: number;
}

export interface RouterPerformanceItem {
  id: string;
  routerName: string;
  status: "ONLINE" | "OFFLINE";
  subscriberCount: number;
  revenueAmount: number;
  sessionCount: number;
  dataVolumeTb: number;
  revenueSharePercent: number;
}

export interface NetworkAnalyticsOverview {
  kpis: AnalyticsKpis;
  paymentsTrend: {
    periodTotal: number;
    previousPeriodTotal: number;
    deltaPercent: number;
    points: PaymentTrendPoint[];
  };
  paymentsVsExpenses: {
    totalPayments: number;
    totalExpenses: number;
    netProfit: number;
    points: PaymentsVsExpensesPoint[];
  };
  topPackages: TopPackageItem[];
  topCustomers: TopCustomerItem[];
  revenueMix: DonutSegment[];
  paymentMethodsMix: DonutSegment[];
  routerPerformance: RouterPerformanceItem[];
}
