import type { AnalyticsDashboardData } from "@/lib/types/analytics";

export function TopRankingsList({ data }: { data: Pick<AnalyticsDashboardData, "topPackages" | "topCustomers"> }) {
  return <div className="grid gap-4 lg:grid-cols-2">
    <section className="rounded-lg border border-border bg-card p-4"><h2 className="text-sm font-medium">Top packages · 30 days</h2><div className="mt-4 space-y-3">{data.topPackages.map((item) => <div key={item.packageId} className="flex justify-between gap-3 border-b pb-2 text-sm"><span>{item.packageName}<span className="ml-2 text-xs text-muted-foreground">{item.newSubs30d} new subs</span></span><span className="whitespace-nowrap font-sans tabular-nums">KES {item.revenue30d}</span></div>)}</div></section>
    <section className="rounded-lg border border-border bg-card p-4"><h2 className="text-sm font-medium">Top customers · 30 days</h2><div className="mt-4 space-y-3">{data.topCustomers.map((item, index) => <div key={item.customerId} className="flex justify-between gap-3 border-b pb-2 text-sm"><span>#{index + 1} {item.customerName}<span className="ml-2 text-xs text-muted-foreground">{item.paymentCount} payments</span></span><span className="whitespace-nowrap font-sans tabular-nums">KES {item.totalPaid}</span></div>)}</div></section>
  </div>;
}
