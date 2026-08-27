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
  const data = await getNetworkAnalyticsData("MONTHLY");

  return (
    <div className="min-h-screen bg-[#0d0d0d] p-4 text-zinc-100 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <span className="text-[11px] font-mono tracking-wider text-zinc-500 uppercase">
              INSIGHTS — ANALYTICS
            </span>
            <h1 className="text-3xl font-serif font-semibold text-white">
              Your network.
            </h1>
            <p className="mt-1 text-xs text-zinc-400">
              All MikroTik routers · Monthly · Updated live
            </p>
          </div>

          <AnalyticsExportButton data={data} />
        </div>

        <AnalyticsKpiCards kpis={data.kpis} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <PaymentsTrendChart
            totalAmount={data.paymentsTrend.periodTotal}
            prevAmount={data.paymentsTrend.previousPeriodTotal}
            deltaPercent={data.paymentsTrend.deltaPercent}
            points={data.paymentsTrend.points}
          />

          <PaymentsVsExpensesChart
            paymentsTotal={data.paymentsVsExpenses.totalPayments}
            expensesTotal={data.paymentsVsExpenses.totalExpenses}
            netProfit={data.paymentsVsExpenses.netProfit}
            points={data.paymentsVsExpenses.points}
          />
        </div>

        <RevenueMixDonuts
          revenueMix={data.revenueMix}
          paymentMethods={data.paymentMethodsMix}
        />

        <TopRankingsList packages={data.topPackages} customers={data.topCustomers} />

        <RouterPerformanceTable routers={data.routerPerformance} />
      </div>
    </div>
  );
}
