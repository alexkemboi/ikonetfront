import React from "react";

interface Props {
 revenueToday: number;
 revenueChangePercent: number;
 mobileMoneyToday: number;
 activeSubscriptions: number;
 onlinePercentage: number;
 onlineCount: number;
 smsCredits: number | null;
 smsCreditLow: boolean;
}

function formatKsh(amount: number): string {
 return `KES ${new Intl.NumberFormat("en-KE", { maximumFractionDigits: 2 }).format(amount)}`;
}

export function OverviewKpiCards({
 revenueToday,
 revenueChangePercent,
 mobileMoneyToday,
 activeSubscriptions,
 onlinePercentage,
 onlineCount,
 smsCredits,
 smsCreditLow,
}: Props) {
 return (
 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
 {/* Card 1: Revenue Today */}
 <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
 <span className="text-[11px] font-sans tabular-nums tracking-wider text-muted-foreground uppercase">
 REVENUE TODAY
 </span>
 <div className="mt-2 flex items-baseline gap-2">
 <span className="text-3xl font-sans tabular-nums font-bold text-foreground">
 {formatKsh(revenueToday)}
 </span>
 </div>
 <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
 <span className={revenueChangePercent >= 0 ? "text-emerald-400" : "text-rose-400"}>
 {revenueChangePercent >= 0 ? `+${revenueChangePercent.toLocaleString("en-US", { maximumFractionDigits: 1 })}%` : `${revenueChangePercent.toLocaleString("en-US", { maximumFractionDigits: 1 })}%`} · since midnight
 </span>
 </div>
 <div className="mt-3 rounded-lg bg-muted px-2.5 py-1.5 text-[11px] font-sans tabular-nums text-muted-foreground">
 Mobile money: {formatKsh(mobileMoneyToday)}
 </div>
 </div>

 {/* Card 2: Active Subscriptions */}
 <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
 <span className="text-[11px] font-sans tabular-nums tracking-wider text-muted-foreground uppercase">
 ACTIVE SUBSCRIPTIONS
 </span>
 <div className="mt-2 text-3xl font-sans tabular-nums font-bold text-foreground">
 {activeSubscriptions}
 </div>
 <p className="mt-2 text-xs text-muted-foreground">currently valid</p>
 <div className="mt-5 h-1 w-full rounded-full bg-secondary">
 <div className="h-1 w-3/4 rounded-full bg-amber-500" />
 </div>
 </div>

 {/* Card 3: Online Now */}
 <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
 <span className="text-[11px] font-sans tabular-nums tracking-wider text-muted-foreground uppercase">
 ONLINE NOW
 </span>
 <div className="mt-2 text-3xl font-sans tabular-nums font-bold text-foreground">
 {onlinePercentage}%
 </div>
 <p className="mt-2 text-xs text-muted-foreground">
 {onlineCount} of {activeSubscriptions} subscribers online
 </p>
 <div className="mt-5 flex items-center gap-1">
 <div className="h-2 w-full rounded-full bg-emerald-500/20">
 <div
 className="h-2 rounded-full bg-emerald-500"
 style={{ width: `${onlinePercentage}%` }}
 />
 </div>
 </div>
 </div>

  {/* Card 4: SMS Credits */}
  <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
  <span className="text-[11px] font-sans tabular-nums tracking-wider text-muted-foreground uppercase">
  SMS CREDITS
  </span>
  <div className="mt-2 text-3xl font-sans tabular-nums font-bold text-foreground">
  {smsCredits === null ? "\u2014" : smsCredits}
  </div>
  <p className="mt-2 text-xs font-medium text-muted-foreground">
    {smsCredits === null ? "Balance unavailable" : smsCredits <= 0 ? "No credits remaining" : smsCreditLow ? "Low balance · top up soon" : "Balance available"}
  </p>
  </div>
 </div>
 );
}