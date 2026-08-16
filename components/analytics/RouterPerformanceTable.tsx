import React from "react";
import type { RouterPerformanceItem } from "@/lib/types/analytics";

interface Props {
  routers: RouterPerformanceItem[];
}

export function RouterPerformanceTable({ routers }: Props) {
  return (
    <div className="rounded-2xl border border-[#262626] bg-[#161616] p-6 shadow-xl">
      <div className="border-b border-[#262626] pb-4">
        <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
          MIKROTIK
        </span>
        <h2 className="text-lg font-semibold text-white">
          MikroTik performance · Monthly
        </h2>
        <p className="text-xs text-zinc-400">Revenue, sessions, and data per router</p>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs font-mono min-w-[720px]">
          <thead>
            <tr className="border-b border-[#262626] text-[11px] tracking-wider text-zinc-400 uppercase">
              <th className="py-3 px-3">ROUTER</th>
              <th className="py-3 px-3">STATUS</th>
              <th className="py-3 px-3">SUBS</th>
              <th className="py-3 px-3">REVENUE</th>
              <th className="py-3 px-3">SESSIONS</th>
              <th className="py-3 px-3">DATA</th>
              <th className="py-3 px-3">SHARE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {routers.map((r) => (
              <tr key={r.id} className="hover:bg-zinc-800/30 transition">
                <td className="py-3.5 px-3 font-semibold text-white">{r.routerName}</td>
                <td className="py-3.5 px-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      r.status === "ONLINE"
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-zinc-800 text-zinc-500"
                    }`}
                  >
                    {r.status === "ONLINE" ? "Online" : "Offline"}
                  </span>
                </td>
                <td className="py-3.5 px-3 text-zinc-300">
                  {r.subscriberCount.toLocaleString()}
                </td>
                <td className="py-3.5 px-3 text-white font-bold">
                  Ksh {r.revenueAmount.toLocaleString()}
                </td>
                <td className="py-3.5 px-3 text-zinc-300">
                  {r.sessionCount.toLocaleString()}
                </td>
                <td className="py-3.5 px-3 text-zinc-300">{r.dataVolumeTb} TB</td>
                <td className="py-3.5 px-3 w-40">
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 flex-1 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-500"
                        style={{ width: `${Math.max(0, Math.min(100, r.revenueSharePercent))}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-zinc-400 w-8">
                      {r.revenueSharePercent}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
