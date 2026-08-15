import React from "react";
import type { AnalyticsKpis } from "@/lib/types/analytics";

interface Props {
  kpis: AnalyticsKpis;
}

export function AnalyticsKpiCards({ kpis }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-4">
      <div className="rounded-2xl border border-[#262626] bg-[#161616] p-5 shadow-lg">
        <span className="text-[11px] font-mono tracking-wider text-zinc-400 uppercase">
          ACTIVE SUBSCRIBERS
        </span>
        <div className="mt-2 text-3xl font-mono font-bold text-white">
          {kpis.activeSubscribersCount}
        </div>
        <p className="mt-1 text-xs text-emerald-400 font-mono">
          +{kpis.newSubscribersCount} new · Monthly
        </p>
      </div>

      <div className="rounded-2xl border border-[#262626] bg-[#161616] p-5 shadow-lg">
        <span className="text-[11px] font-mono tracking-wider text-zinc-400 uppercase">
          REVENUE
        </span>
        <div className="mt-2 text-3xl font-mono font-bold text-white">
          Ksh {kpis.revenueAmount.toLocaleString()}
        </div>
        <p className="mt-1 text-xs text-zinc-400">Monthly</p>
      </div>

      <div className="rounded-2xl border border-[#262626] bg-[#161616] p-5 shadow-lg">
        <span className="text-[11px] font-mono tracking-wider text-zinc-400 uppercase">
          ARPU
        </span>
        <div className="mt-2 text-3xl font-mono font-bold text-white">
          Ksh {kpis.arpuAmount.toLocaleString()}
        </div>
        <p className="mt-1 text-xs text-zinc-400">per active subscriber</p>
      </div>

      <div className="rounded-2xl border border-[#262626] bg-[#161616] p-5 shadow-lg">
        <span className="text-[11px] font-mono tracking-wider text-zinc-400 uppercase">
          SESSIONS
        </span>
        <div className="mt-2 text-3xl font-mono font-bold text-white">
          {kpis.sessionsCount.toLocaleString()}
        </div>
        <p className="mt-1 text-xs text-zinc-400">avg {kpis.avgSessionDuration}</p>
      </div>

      <div className="rounded-2xl border border-[#262626] bg-[#161616] p-5 shadow-lg">
        <span className="text-[11px] font-mono tracking-wider text-zinc-400 uppercase">
          DATA TRANSFERRED
        </span>
        <div className="mt-2 text-3xl font-mono font-bold text-white">
          {kpis.dataTransferredTb} TB
        </div>
        <p className="mt-1 text-xs text-zinc-400">{kpis.dataDownloadTb} TB down</p>
      </div>

      <div className="rounded-2xl border border-[#262626] bg-[#161616] p-5 shadow-lg">
        <span className="text-[11px] font-mono tracking-wider text-zinc-400 uppercase">
          ONLINE NOW
        </span>
        <div className="mt-2 text-3xl font-mono font-bold text-emerald-400">
          {kpis.onlineNowCount}
        </div>
        <p className="mt-1 text-xs text-zinc-400">open sessions</p>
      </div>

      <div className="rounded-2xl border border-[#262626] bg-[#161616] p-5 shadow-lg">
        <span className="text-[11px] font-mono tracking-wider text-zinc-400 uppercase">
          PAYMENTS
        </span>
        <div className="mt-2 text-3xl font-mono font-bold text-white">
          {kpis.paymentsCount.toLocaleString()}
        </div>
        <p className="mt-1 text-xs text-zinc-400">Monthly</p>
      </div>

      <div className="rounded-2xl border border-[#262626] bg-[#161616] p-5 shadow-lg">
        <span className="text-[11px] font-mono tracking-wider text-zinc-400 uppercase">
          OVERDUE
        </span>
        <div className="mt-2 text-3xl font-mono font-bold text-white">
          Ksh {kpis.overdueAmount}
        </div>
        <p className="mt-1 text-xs text-zinc-400">0 invoices</p>
      </div>
    </div>
  );
}
