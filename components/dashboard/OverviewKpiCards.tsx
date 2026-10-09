import React from "react";

/** Online sessions split by service, from the live-sessions KPI block. */
export interface OnlineBreakdown {
 total: number;
 hotspot: number;
 pppoe: number;
}

interface Props {
 revenueToday: number;
 revenueChangePercent: number;
 mobileMoneyToday: number;
 /** PPPoE (portal) subscriptions that are currently valid. */
 activePppoeSubscriptions: number;
 /** Cockpit's online total; used when the per-service breakdown is unavailable. */
 onlineCount: number;
 online: OnlineBreakdown | null;
 smsCredits: number | null;
 smsCreditLow: boolean;
}

function formatKsh(amount: number): string {
 return `KES ${new Intl.NumberFormat("en-KE", { maximumFractionDigits: 2 }).format(amount)}`;
}

/** part/whole as 0..100; a ratio across mismatched populations can never exceed a full bar. */
function sharePercent(part: number, whole: number): number {
 if (whole <= 0) return 0;
 return Math.min(100, Math.max(0, (part / whole) * 100));
}

export function OverviewKpiCards({
 revenueToday,
 revenueChangePercent,
 mobileMoneyToday,
 activePppoeSubscriptions,
 onlineCount,
 online,
 smsCredits,
 smsCreditLow,
}: Props) {
 const onlineTotal = online?.total ?? onlineCount;
 // TV and any future protocol: whatever the total holds beyond hotspot + PPPoE
 const otherOnline = online ? Math.max(0, online.total - online.hotspot - online.pppoe) : 0;
 const pppoeOnline = online ? Math.min(online.pppoe, activePppoeSubscriptions) : null;
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

 {/* Card 2: Active PPPoE subscriptions */}
 <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
 <span className="text-[11px] font-sans tabular-nums tracking-wider text-muted-foreground uppercase">
 ACTIVE PPPOE CLIENTS
 </span>
 <div className="mt-2 text-3xl font-sans tabular-nums font-bold text-foreground">
 {activePppoeSubscriptions.toLocaleString()}
 </div>
 <p className="mt-2 text-xs text-muted-foreground">
 {pppoeOnline === null
 ? "PPPoE subscriptions currently valid"
 : `${pppoeOnline.toLocaleString()} of ${activePppoeSubscriptions.toLocaleString()} online now`}
 </p>
 {pppoeOnline !== null && activePppoeSubscriptions > 0 && (
 <div className="mt-5 h-1 w-full rounded-full bg-secondary">
 <div
 className="h-1 rounded-full bg-amber-500"
 style={{ width: `${sharePercent(pppoeOnline, activePppoeSubscriptions)}%` }}
 />
 </div>
 )}
 </div>

 {/* Card 3: Online now, across all services */}
 <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
 <span className="text-[11px] font-sans tabular-nums tracking-wider text-muted-foreground uppercase">
 ONLINE NOW
 </span>
 <div className="mt-2 text-3xl font-sans tabular-nums font-bold text-foreground">
 {onlineTotal.toLocaleString()}
 </div>
 {online ? (
 <>
 <p className="mt-2 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
 <span className="inline-flex items-center gap-1.5">
 <span className="h-2 w-2 rounded-full bg-emerald-500" />
 Hotspot {online.hotspot.toLocaleString()}
 </span>
 <span className="inline-flex items-center gap-1.5">
 <span className="h-2 w-2 rounded-full bg-amber-500" />
 PPPoE {online.pppoe.toLocaleString()}
 </span>
 {otherOnline > 0 && (
 <span className="inline-flex items-center gap-1.5">
 <span className="h-2 w-2 rounded-full bg-sky-500" />
 Other {otherOnline.toLocaleString()}
 </span>
 )}
 </p>
 {online.total > 0 && (
 <div className="mt-5 flex h-2 w-full overflow-hidden rounded-full bg-secondary">
 <div className="h-2 bg-emerald-500" style={{ width: `${sharePercent(online.hotspot, online.total)}%` }} />
 <div className="h-2 bg-amber-500" style={{ width: `${sharePercent(online.pppoe, online.total)}%` }} />
 <div className="h-2 bg-sky-500" style={{ width: `${sharePercent(otherOnline, online.total)}%` }} />
 </div>
 )}
 </>
 ) : (
 <p className="mt-2 text-xs text-muted-foreground">sessions connected · breakdown unavailable</p>
 )}
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