"use client";

import { AnalyticsDashboardData } from "@/lib/types/analytics";

export function AnalyticsExportButton({ data }: { data: AnalyticsDashboardData }) {
 function handleExport() {
 const lines: string[] = [];
 const push = (r: (string | number)[]) =>
 lines.push(r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","));

 push(["Metric", "Value"]);
 push(["Subscribers", data.kpis.subscriberCount ?? "-"]);
 push(["Active Subscriptions", data.kpis.activeSubscriptionCount ?? "-"]);
 push(["Revenue (KES)", data.kpis.revenue30d ?? "-"]);
 push(["Profit (KES)", data.kpis.profit30d ?? "-"]);
 push(["ARPU (KES)", data.kpis.arpu30d ?? "-"]);
 push(["Uncollected (KES)", data.kpis.uncollectedInvoices30d ?? "-"]);

 lines.push("");
 push(["Router", "Telemetry", "Sessions", "Data (GB)", "Revenue (KES)", "Share %"]);
 for (const r of data.routerPerformance) {
 push([
 r.routerName,
 r.telemetryStatus,
 r.activeSessions,
 r.dataTransferredGb ?? "-",
 r.revenueAmount ?? "-",
 r.revenueSharePercent ?? "-",
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