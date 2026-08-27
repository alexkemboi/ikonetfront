import type { SubscriberKpis } from "@/lib/types/subscribers";

export function SubscriberKpiCards({ kpis }: { kpis: SubscriberKpis }) {
 return (
 <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
 {/* 1. All Users */}
 <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
 <span className="text-[11px] font-mono tracking-wider text-muted-foreground uppercase">
 ALL USERS
 </span>
 <div className="mt-2 text-3xl font-mono font-bold text-foreground">
 {kpis.allUsersCount.toLocaleString()}
 </div>
 <p className="mt-2 text-xs text-muted-foreground">registered accounts</p>
 </div>

 {/* 2. Expiring in 7 Days */}
 <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
 <span className="text-[11px] font-mono tracking-wider text-muted-foreground uppercase">
 EXPIRING IN 7 DAYS
 </span>
 <div className="mt-2 text-3xl font-mono font-bold text-amber-400">
 {kpis.expiringIn7DaysCount}
 </div>
 <p className="mt-2 text-xs text-muted-foreground">renewals due next week</p>
 </div>

 {/* 3. Online Now */}
 <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
 <span className="text-[11px] font-mono tracking-wider text-muted-foreground uppercase">
 ONLINE NOW
 </span>
 <div className="mt-2 flex items-baseline gap-2">
 <span className="text-3xl font-mono font-bold text-emerald-400">
 {kpis.onlineCount}
 </span>
 <span className="text-sm font-mono font-semibold text-emerald-500/80">
 {kpis.onlinePercentage}%
 </span>
 </div>
 <div className="mt-3 flex items-center gap-2">
 <div className="h-1.5 w-full rounded-full bg-emerald-500/20">
 <div
 className="h-1.5 rounded-full bg-emerald-500"
 style={{ width: `${Math.min(100, kpis.onlinePercentage)}%` }}
 />
 </div>
 </div>
 </div>

 {/* 4. New This Week */}
 <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
 <span className="text-[11px] font-mono tracking-wider text-muted-foreground uppercase">
 NEW THIS WEEK
 </span>
 <div className="mt-2 text-3xl font-mono font-bold text-foreground">
 {kpis.newThisWeekCount}
 </div>
 <p className="mt-2 text-xs text-muted-foreground">joined in last 7 days</p>
 </div>

 {/* 5. At Risk */}
 <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
 <span className="text-[11px] font-mono tracking-wider text-muted-foreground uppercase">
 AT RISK
 </span>
 <div className="mt-2 text-3xl font-mono font-bold text-amber-400">
 {kpis.atRiskCount}
 </div>
 <p className="mt-2 text-xs text-muted-foreground">stale or no subscription</p>
 </div>
 </div>
 );
}