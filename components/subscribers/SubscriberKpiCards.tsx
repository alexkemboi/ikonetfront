import type { SubscriberKpis } from "@/lib/types/subscribers";

export function SubscriberKpiCards({ kpis }: { kpis: SubscriberKpis }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {/* 1. All Users */}
      <div className="rounded-2xl border border-[#262626] bg-[#161616] p-5 shadow-lg">
        <span className="text-[11px] font-mono tracking-wider text-zinc-400 uppercase">
          ALL USERS
        </span>
        <div className="mt-2 text-3xl font-mono font-bold text-white">
          {kpis.allUsersCount.toLocaleString()}
        </div>
        <p className="mt-2 text-xs text-zinc-500">registered accounts</p>
      </div>

      {/* 2. Expiring in 7 Days */}
      <div className="rounded-2xl border border-[#262626] bg-[#161616] p-5 shadow-lg">
        <span className="text-[11px] font-mono tracking-wider text-zinc-400 uppercase">
          EXPIRING IN 7 DAYS
        </span>
        <div className="mt-2 text-3xl font-mono font-bold text-amber-400">
          {kpis.expiringIn7DaysCount}
        </div>
        <p className="mt-2 text-xs text-zinc-500">renewals due next week</p>
      </div>

      {/* 3. Online Now */}
      <div className="rounded-2xl border border-[#262626] bg-[#161616] p-5 shadow-lg">
        <span className="text-[11px] font-mono tracking-wider text-zinc-400 uppercase">
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
      <div className="rounded-2xl border border-[#262626] bg-[#161616] p-5 shadow-lg">
        <span className="text-[11px] font-mono tracking-wider text-zinc-400 uppercase">
          NEW THIS WEEK
        </span>
        <div className="mt-2 text-3xl font-mono font-bold text-white">
          {kpis.newThisWeekCount}
        </div>
        <p className="mt-2 text-xs text-zinc-500">joined in last 7 days</p>
      </div>

      {/* 5. At Risk */}
      <div className="rounded-2xl border border-[#262626] bg-[#161616] p-5 shadow-lg">
        <span className="text-[11px] font-mono tracking-wider text-zinc-400 uppercase">
          AT RISK
        </span>
        <div className="mt-2 text-3xl font-mono font-bold text-amber-400">
          {kpis.atRiskCount}
        </div>
        <p className="mt-2 text-xs text-zinc-500">stale or no subscription</p>
      </div>
    </div>
  );
}