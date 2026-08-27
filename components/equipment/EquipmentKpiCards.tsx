import React from "react";
import { EquipmentKpis } from "@/lib/types/equipment";

interface Props {
  kpis: EquipmentKpis;
}

export function EquipmentKpiCards({ kpis }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {/* In Stock */}
      <div className="rounded-2xl border border-[#262626] bg-[#161616] p-5 shadow-lg">
        <span className="text-[11px] font-mono tracking-wider text-zinc-400 uppercase">
          IN STOCK
        </span>
        <div className="mt-2 text-3xl font-mono font-bold text-white">
          {kpis.inStockCount}
        </div>
        <p className="mt-1 text-xs text-zinc-400">ready to deploy</p>
      </div>

      {/* Assigned */}
      <div className="rounded-2xl border border-[#262626] bg-[#161616] p-5 shadow-lg">
        <span className="text-[11px] font-mono tracking-wider text-zinc-400 uppercase">
          ASSIGNED
        </span>
        <div className="mt-2 text-3xl font-mono font-bold text-white">
          {kpis.assignedCount}
        </div>
        <p className="mt-1 text-xs text-zinc-400">in subscriber hands</p>
      </div>

      {/* Inventory Basis */}
      <div className="rounded-2xl border border-[#262626] bg-[#161616] p-5 shadow-lg">
        <span className="text-[11px] font-mono tracking-wider text-zinc-400 uppercase">
          INVENTORY
        </span>
        <div className="mt-2 text-3xl font-mono font-bold text-white">
          Ksh {kpis.inventoryCostBasis.toLocaleString()}
        </div>
        <p className="mt-1 text-xs text-zinc-400">total cost basis</p>
      </div>

      {/* Collected */}
      <div className="rounded-2xl border border-[#262626] bg-[#161616] p-5 shadow-lg">
        <span className="text-[11px] font-mono tracking-wider text-zinc-400 uppercase">
          COLLECTED
        </span>
        <div className="mt-2 text-3xl font-mono font-bold text-white">
          Ksh {kpis.totalCollected.toLocaleString()}
        </div>
        <p className="mt-1 text-xs text-zinc-400">paid against equipment</p>
      </div>
    </div>
  );
}