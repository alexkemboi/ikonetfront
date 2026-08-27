import React from "react";
import type { AnalyticsKpis } from "@/lib/types/analytics";

interface Props {
 kpis: AnalyticsKpis;
}

export function AnalyticsKpiCards({ kpis }: Props) {
 return (
 <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-4">
 <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
 <span className="text-[11px] font-mono tracking-wider text-muted-foreground uppercase">
 ACTIVE SUBSCRIBERS
 </span>
 <div className="mt-2 text-3xl font-mono font-bold text-foreground">
 {kpis.activeSubscribersCount}
 </div>
 <p className="mt-1 text-xs text-emerald-400 font-mono">
 +{kpis.newSubscribersCount} new · Monthly
 </p>
 </div>

 <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
 <span className="text-[11px] font-mono tracking-wider text-muted-foreground uppercase">
 REVENUE
 </span>
 <div className="mt-2 text-3xl font-mono font-bold text-foreground">
 Ksh {kpis.revenueAmount.toLocaleString()}
 </div>
 <p className="mt-1 text-xs text-muted-foreground">Monthly</p>
 </div>

 <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
 <span className="text-[11px] font-mono tracking-wider text-muted-foreground uppercase">
 ARPU
 </span>
 <div className="mt-2 text-3xl font-mono font-bold text-foreground">
 Ksh {kpis.arpuAmount.toLocaleString()}
 </div>
 <p className="mt-1 text-xs text-muted-foreground">per active subscriber</p>
 </div>

 <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
 <span className="text-[11px] font-mono tracking-wider text-muted-foreground uppercase">
 SESSIONS
 </span>
 <div className="mt-2 text-3xl font-mono font-bold text-foreground">
 {kpis.sessionsCount.toLocaleString()}
 </div>
 <p className="mt-1 text-xs text-muted-foreground">avg {kpis.avgSessionDuration}</p>
 </div>

 <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
 <span className="text-[11px] font-mono tracking-wider text-muted-foreground uppercase">
 DATA TRANSFERRED
 </span>
 <div className="mt-2 text-3xl font-mono font-bold text-foreground">
 {kpis.dataTransferredTb} TB
 </div>
 <p className="mt-1 text-xs text-muted-foreground">{kpis.dataDownloadTb} TB down</p>
 </div>

 <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
 <span className="text-[11px] font-mono tracking-wider text-muted-foreground uppercase">
 ONLINE NOW
 </span>
 <div className="mt-2 text-3xl font-mono font-bold text-emerald-400">
 {kpis.onlineNowCount}
 </div>
 <p className="mt-1 text-xs text-muted-foreground">open sessions</p>
 </div>

 <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
 <span className="text-[11px] font-mono tracking-wider text-muted-foreground uppercase">
 PAYMENTS
 </span>
 <div className="mt-2 text-3xl font-mono font-bold text-foreground">
 {kpis.paymentsCount.toLocaleString()}
 </div>
 <p className="mt-1 text-xs text-muted-foreground">Monthly</p>
 </div>

 <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
 <span className="text-[11px] font-mono tracking-wider text-muted-foreground uppercase">
 OVERDUE
 </span>
 <div className="mt-2 text-3xl font-mono font-bold text-foreground">
 Ksh {kpis.overdueAmount}
 </div>
 <p className="mt-1 text-xs text-muted-foreground">0 invoices</p>
 </div>
 </div>
 );
}
