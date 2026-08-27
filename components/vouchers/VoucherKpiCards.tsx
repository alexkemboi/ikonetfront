import React from "react";
import { VoucherKpis } from "@/lib/types/vouchers";

interface Props {
  kpis: VoucherKpis;
}

export function VoucherKpiCards({ kpis }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {/* Total */}
      <div className="rounded-2xl border border-[#262626] bg-[#161616] p-5 shadow-lg">
        <span className="text-[11px] font-mono tracking-wider text-zinc-400 uppercase">
          TOTAL
        </span>
        <div className="mt-2 text-3xl font-mono font-bold text-white">
          {kpis.totalGenerated}
        </div>
        <p className="mt-1 text-xs text-zinc-400">generated codes</p>
      </div>

      {/* Used */}
      <div className="rounded-2xl border border-[#262626] bg-[#161616] p-5 shadow-lg">
        <span className="text-[11px] font-mono tracking-wider text-zinc-400 uppercase">
          USED
        </span>
        <div className="mt-2 text-3xl font-mono font-bold text-emerald-400">
          {kpis.usedCount}
        </div>
        <p className="mt-1 text-xs text-zinc-400">
          {kpis.redemptionRatePercent}% redemption rate
        </p>
      </div>

      {/* Unused */}
      <div className="rounded-2xl border border-[#262626] bg-[#161616] p-5 shadow-lg">
        <span className="text-[11px] font-mono tracking-wider text-zinc-400 uppercase">
          UNUSED
        </span>
        <div className="mt-2 text-3xl font-mono font-bold text-amber-400">
          {kpis.unusedCount}
        </div>
        <p className="mt-1 text-xs text-zinc-400">available to distribute</p>
      </div>

      {/* Batches */}
      <div className="rounded-2xl border border-[#262626] bg-[#161616] p-5 shadow-lg">
        <span className="text-[11px] font-mono tracking-wider text-zinc-400 uppercase">
          BATCHES
        </span>
        <div className="mt-2 text-3xl font-mono font-bold text-white">
          {kpis.batchesCount}
        </div>
        <p className="mt-1 text-xs text-zinc-400">minting runs</p>
      </div>
    </div>
  );
}