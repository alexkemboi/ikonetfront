"use client";

import { NetworkAnalyticsOverview } from "@/lib/types/analytics";

export function AnalyticsExportButton({ data }: { data: NetworkAnalyticsOverview }) {
 function handleExport() {
 const lines: string[] = [];
 const push = (r: (string | number)[]) =>
 lines.push(r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","));

 push(["Metric", "Value"]);
 push(["Active Subscribers", data.kpis.activeSubscribersCount]);
 push(["New Subscribers", data.kpis.newSubscribersCount]);
 push(["Total Revenue", data.kpis.revenueAmount]);
 push(["ARPU", data.kpis.arpuAmount]);
 push(["Total Sessions", data.kpis.sessionsCount]);
 push(["Data Transferred (TB)", data.kpis.dataTransferredTb]);
 push(["Online Now", data.kpis.onlineNowCount]);

 lines.push("");
 push(["Router", "Status", "Subscribers", "Revenue", "Sessions", "Data (TB)", "Share %"]);
 for (const r of data.routerPerformance) {
 push([
 r.routerName,
 r.status,
 r.subscriberCount,
 r.revenueAmount,
 r.sessionCount,
 r.dataVolumeTb,
 r.revenueSharePercent,
 ]);
 }

 const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
 const url = URL.createObjectURL(blob);
 const anchor = document.createElement("a");
 anchor.href = url;
 anchor.download = `network_analytics_${new Date().toISOString().slice(0, 10)}.csv`;
 document.body.appendChild(anchor);
 anchor.click();
 document.body.removeChild(anchor);
 URL.revokeObjectURL(url);
 }

 return (
 <button
 onClick={handleExport}
 className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-sans tabular-nums font-semibold text-muted-foreground hover:bg-accent transition"
 >
 Export CSV
 </button>
 );
}