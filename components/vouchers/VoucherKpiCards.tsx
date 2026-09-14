import React from "react";
import { VoucherKpis } from "@/lib/types/vouchers";

interface Props {
 kpis: VoucherKpis;
}

export function VoucherKpiCards({ kpis }: Props) {
 return (
 <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
 {/* Total */}
 <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
 <span className="text-[11px] font-sans tabular-nums tracking-wider text-muted-foreground uppercase">
 TOTAL
 </span>
 <div className="mt-2 text-3xl font-sans tabular-nums font-bold text-foreground">
 {kpis.totalGenerated}
 </div>
 <p className="mt-1 text-xs text-muted-foreground">generated codes</p>
 </div>

 {/* Used */}
 <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
 <span className="text-[11px] font-sans tabular-nums tracking-wider text-muted-foreground uppercase">
 USED
 </span>
 <div className="mt-2 text-3xl font-sans tabular-nums font-bold text-emerald-400">
 {kpis.usedCount}
 </div>
 <p className="mt-1 text-xs text-muted-foreground">
 {kpis.redemptionRatePercent}% redemption rate
 </p>
 </div>

 {/* Unused */}
 <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
 <span className="text-[11px] font-sans tabular-nums tracking-wider text-muted-foreground uppercase">
 UNUSED
 </span>
 <div className="mt-2 text-3xl font-sans tabular-nums font-bold text-amber-400">
 {kpis.unusedCount}
 </div>
 <p className="mt-1 text-xs text-muted-foreground">available to distribute</p>
 </div>

 {/* Batches */}
 <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
 <span className="text-[11px] font-sans tabular-nums tracking-wider text-muted-foreground uppercase">
 BATCHES
 </span>
 <div className="mt-2 text-3xl font-sans tabular-nums font-bold text-foreground">
 {kpis.batchesCount}
 </div>
 <p className="mt-1 text-xs text-muted-foreground">minting runs</p>
 </div>
 </div>
 );
}