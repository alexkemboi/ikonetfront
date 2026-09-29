"use client";

import type { AnalyticsDashboardData } from "@/lib/types/analytics";

export function PaymentsVsExpensesChart({ points }: { points: AnalyticsDashboardData["paymentsVsExpenses"]["points"] }) {
  const max = Math.max(1, ...points.map((point) => Number.parseFloat(point.revenue) || 0), ...points.map((point) => Number.parseFloat(point.expense) || 0));
  return <section className="rounded-lg border border-border bg-card p-4"><div className="border-b border-border pb-3"><h2 className="text-sm font-medium">Revenue vs expenses · Monthly</h2><p className="text-xs text-muted-foreground">Money strings are shown directly from the ledger summary</p></div>
    <div className="mt-4 flex h-44 items-end gap-1 overflow-x-auto">{points.map((point) => {
      const revenue = Number.parseFloat(point.revenue) || 0;
      const expense = Number.parseFloat(point.expense) || 0;
      return <div key={point.date} className="group relative flex h-full min-w-4 flex-1 flex-col justify-end gap-0.5"><div className="w-full rounded-t bg-emerald-600" style={{ height: `${Math.max(2, revenue / max * 100)}%` }} /><div className="w-full bg-amber-500" style={{ height: `${Math.max(1, expense / max * 100)}%` }} /><div className="absolute bottom-full z-10 mb-1 hidden whitespace-nowrap rounded border bg-background p-2 text-[10px] shadow group-hover:block"><p>{point.date}</p><p>Revenue: KES {point.revenue}</p><p>Expense: KES {point.expense}</p><p>Profit: KES {point.profit}</p></div></div>;
    })}</div><div className="mt-3 text-[11px] text-muted-foreground">Green: revenue · Amber: expense · Tooltip includes backend profit</div>
  </section>;
}
