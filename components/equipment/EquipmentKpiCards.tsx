import React from "react";
import { EquipmentKpis } from "@/lib/types/equipment";

interface Props {
 kpis: EquipmentKpis;
}

export function EquipmentKpiCards({ kpis }: Props) {
 return (
 <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
 {/* In Stock */}
 <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
 <span className="text-[11px] font-sans tabular-nums tracking-wider text-muted-foreground uppercase">
 IN STOCK
 </span>
 <div className="mt-2 text-3xl font-sans tabular-nums font-bold text-foreground">
 {kpis.inStockCount}
 </div>
 <p className="mt-1 text-xs text-muted-foreground">ready to deploy</p>
 </div>

 {/* Assigned */}
 <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
 <span className="text-[11px] font-sans tabular-nums tracking-wider text-muted-foreground uppercase">
 ASSIGNED
 </span>
 <div className="mt-2 text-3xl font-sans tabular-nums font-bold text-foreground">
 {kpis.assignedCount}
 </div>
 <p className="mt-1 text-xs text-muted-foreground">in subscriber hands</p>
 </div>

 {/* Inventory Basis */}
 <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
 <span className="text-[11px] font-sans tabular-nums tracking-wider text-muted-foreground uppercase">
 INVENTORY
 </span>
 <div className="mt-2 text-3xl font-sans tabular-nums font-bold text-foreground">
 Ksh {kpis.inventoryCostBasis.toLocaleString()}
 </div>
 <p className="mt-1 text-xs text-muted-foreground">total cost basis</p>
 </div>

 {/* Collected */}
 <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
 <span className="text-[11px] font-sans tabular-nums tracking-wider text-muted-foreground uppercase">
 COLLECTED
 </span>
 <div className="mt-2 text-3xl font-sans tabular-nums font-bold text-foreground">
 Ksh {kpis.totalCollected.toLocaleString()}
 </div>
 <p className="mt-1 text-xs text-muted-foreground">paid against equipment</p>
 </div>
 </div>
 );
}