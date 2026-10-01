import type { AnalyticsDashboardData } from "@/lib/types/analytics";

const cards = [
  ["REVENUE · 30D", "revenue30d", true],
  ["PROFIT · 30D", "profit30d", true],
  ["MARGIN · 30D", "marginPct", false],
  ["SUBSCRIBERS", "subscriberCount", false],
  ["ACTIVE SUBSCRIPTIONS", "activeSubscriptionCount", false],
  ["CHURN · 30D", "churnRate30d", false],
  ["ARPU · 30D", "arpu30d", true],
  ["AVG DAYS TO PAY", "avgDaysToPay", false],
  ["UNCOLLECTED · 30D", "uncollectedInvoices30d", true],
  ["BAD DEBT · 30D", "badDebtExpense30d", true],
  ["AVG SESSION · 30D", "avgSessionDurationMinutes30d", false],
] as const;

export function AnalyticsKpiCards({ kpis }: { kpis: AnalyticsDashboardData["kpis"] }) {
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">{cards.map(([label, key, money]) => {
    const value = kpis[key];
    const shown = value == null ? "-" : money ? `KES ${value}` : String(value);
    return <div key={key} className="rounded-lg border border-border bg-card p-4"><p className="text-[11px] uppercase text-muted-foreground">{label}</p><p className="mt-2 break-words text-xl font-semibold tabular-nums">{shown}</p>{value == null && <p className="mt-1 text-xs text-muted-foreground">Not available</p>}</div>;
  })}</div>;
}
