"use client";

import type { AnalyticsDashboardData } from "@/lib/types/analytics";

export function PaymentsTrendChart({ trend }: { trend: AnalyticsDashboardData["paymentsTrend"] }) {
  const max = Math.max(1, ...trend.points.map((point) => Number.parseFloat(point.currentRevenue) || 0));
  return <section className="rounded-lg border border-border bg-card p-4">
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-3"><div><h2 className="text-sm font-medium">Revenue trend · 30 days</h2><p className="text-xs text-muted-foreground">Current period compared with aligned prior period</p></div><p className="text-xs text-muted-foreground">{trend.deltaPercent == null ? "New" : `${trend.deltaPercent}%`} change</p></div>
    <div className="mt-4 flex h-44 items-end gap-1 overflow-x-auto">{trend.points.map((point) => {
      const amount = Number.parseFloat(point.currentRevenue) || 0;
      return <div key={point.date} className="group relative flex h-full min-w-3 flex-1 flex-col justify-end"><div className="w-full rounded-t bg-emerald-600" style={{ height: `${Math.max(2, amount / max * 100)}%` }} /><div className="absolute bottom-full z-10 mb-1 hidden whitespace-nowrap rounded border bg-background p-2 text-[10px] shadow group-hover:block"><p>{point.date}</p><p>Current: KES {point.currentRevenue}</p><p>Previous ({point.previousDate}): KES {point.previousRevenue}</p><p>{point.paymentCount} payments</p></div></div>;
    })}</div>
    <div className="mt-3 flex justify-between border-t border-border pt-3 text-xs"><span>Current: KES {trend.periodTotal}</span><span>Previous: KES {trend.previousPeriodTotal}</span></div>
  </section>;
}
