import React from "react";
import type { PaymentsVsExpensesPoint } from "@/lib/types/analytics";
import { CHART_MAX_VAL } from "@/components/analytics/chart-constants";

interface Props {
  paymentsTotal: number;
  expensesTotal: number;
  netProfit: number;
  points: PaymentsVsExpensesPoint[];
}

export function PaymentsVsExpensesChart({
  paymentsTotal,
  expensesTotal,
  netProfit,
  points,
}: Props) {
  return (
    <div className="rounded-2xl border border-[#262626] bg-[#161616] p-6 shadow-xl">
      <div className="border-b border-[#262626] pb-4">
        <h2 className="text-lg font-semibold text-white">Payments vs expenses · Monthly</h2>
        <p className="text-xs text-zinc-400">Money in (bars) vs money out (line)</p>
      </div>

      <div className="mt-6 h-48 w-full flex items-end gap-1.5 pt-4">
        {points.map((p) => {
          const barHeight = Math.min(
            100,
            Math.max(5, (p.paymentsAmount / CHART_MAX_VAL) * 100)
          );
          return (
            <div key={p.day} className="flex-1 flex flex-col items-center gap-2 group relative">
              <div className="absolute -top-8 hidden rounded bg-zinc-800 px-2 py-1 text-[10px] font-mono text-white group-hover:block z-10 whitespace-nowrap">
                Day {p.day}: Ksh {p.paymentsAmount.toLocaleString()}
              </div>
              <div
                className="w-full rounded-t bg-amber-500/80 hover:bg-amber-400 transition"
                style={{ height: `${barHeight}%` }}
              />
              <span className="text-[9px] font-mono text-zinc-500">{p.day}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between border-t border-[#262626] pt-4 text-xs font-mono text-zinc-400">
        <div>
          Payments <strong className="text-white">Ksh {paymentsTotal.toLocaleString()}</strong> · Expenses{" "}
          <strong className="text-zinc-400">Ksh {expensesTotal.toLocaleString()}</strong>
        </div>
        <div className="text-emerald-400 font-bold">Net Ksh {netProfit.toLocaleString()}</div>
      </div>
    </div>
  );
}
