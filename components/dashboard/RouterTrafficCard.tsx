import React from "react";
import { RouterTrafficItem } from "@/lib/types/dashboard";

interface Props {
  items: RouterTrafficItem[];
  healthyRouters?: number;
  totalRouters?: number;
}

export function RouterTrafficCard({ items, healthyRouters, totalRouters }: Props) {
  return (
    <div className="flex flex-col rounded-2xl border border-[#262626] bg-[#161616] p-6 shadow-xl">
      <div className="flex items-center justify-between border-b border-[#262626] pb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Where the traffic is</h2>
          <p className="text-xs text-zinc-400">Busiest routers · last hour</p>
        </div>
        <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-mono text-emerald-400">
          {healthyRouters ?? items.length}/{totalRouters ?? items.length} healthy
        </span>
      </div>

      <div className="mt-6 space-y-6">
        {items.map((r) => (
          <div key={r.id}>
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-semibold text-white">{r.routerName}</span>
              <span className="font-mono text-xs text-amber-400">
                {r.trafficSharePercent}% of live sessions
              </span>
            </div>

            <div className="mt-1.5 text-xs text-zinc-400">
              {r.activeSessions} sessions · <span className="font-mono text-zinc-300">{r.dataTransferredGb} GB</span>
            </div>

            {/* Progress Bar */}
            <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-amber-500"
                style={{ width: `${r.trafficSharePercent}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}