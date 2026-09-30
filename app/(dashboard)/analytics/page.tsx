import React from "react";
import type { Metadata } from "next";
import { getNetworkAnalyticsData } from "@/actions/analytics";
import { AnalyticsKpiCards } from "@/components/analytics/AnalyticsKpiCards";
import { PaymentsTrendChart } from "@/components/analytics/PaymentsTrendChart";
import { PaymentsVsExpensesChart } from "@/components/analytics/PaymentsVsExpensesChart";
import { RevenueMixDonuts } from "@/components/analytics/RevenueMixDonuts";
import { TopRankingsList } from "@/components/analytics/TopRankingsList";
import { RouterPerformanceTable } from "@/components/analytics/RouterPerformanceTable";
import { AnalyticsExportButton } from "@/components/analytics/AnalyticsExportButton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
 title: "Network Analytics & Revenue Attribution | IBS Platform",
 description: "Comprehensive multi-router telemetry and financial attribution",
};

export default async function AnalyticsDashboardPage() {
 const result = await getNetworkAnalyticsData();

 if (!result.success) {
  return <main className="min-h-screen p-4 sm:p-6 lg:p-8"><div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-5"><h1 className="text-lg font-medium">Analytics unavailable</h1><p className="mt-1 text-sm text-muted-foreground">{result.message}{result.requestId ? ` · Ref: ${result.requestId}` : ""}</p></div></main>;
 }
 const data = result.data;

 return (
 <div className="min-h-screen p-4 text-foreground sm:p-6 lg:p-8">
 <div className="mx-auto max-w-7xl space-y-6">
 <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
 <div>
 <span className="text-[11px] font-sans tabular-nums tracking-wider text-muted-foreground uppercase">
 INSIGHTS — ANALYTICS
 </span>
 <h1 className="text-3xl font-sans font-normal text-foreground">
 Your network.
 </h1>
 <p className="mt-1 text-xs text-muted-foreground">{data.period.from} to {data.period.to} · {data.period.timezone} · Updated {new Date(data.generatedAt).toLocaleString()}</p>
 </div>

 <AnalyticsExportButton data={data} />
 </div>

 {data.dataStatus === "PARTIAL" && <div role="status" className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950"><p>Some analytics could not be loaded. A dash marks a value that is unavailable.</p>{data.unavailableMetrics.length > 0 && <ul className="mt-2 space-y-1">{data.unavailableMetrics.map(({ metric, reason }) => <li key={`${metric}-${reason}`}><span className="font-medium">{metric}</span>: {reason}</li>)}</ul>}</div>}
 <AnalyticsKpiCards kpis={data.kpis} />

 <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
 <PaymentsTrendChart trend={data.paymentsTrend} />

 <PaymentsVsExpensesChart points={data.paymentsVsExpenses.points} />
 </div>

 <RevenueMixDonuts data={data} />

 <TopRankingsList data={data} />

 <RouterPerformanceTable data={data} />
 </div>
 </div>
 );
}
