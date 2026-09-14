"use client";

import React from "react";
import type { PaymentTrendPoint } from "@/lib/types/analytics";
import { CHART_MAX_VAL } from "@/components/analytics/chart-constants";

interface Props {
 totalAmount: number;
 prevAmount: number;
 deltaPercent: number;
 points: PaymentTrendPoint[];
}

export function PaymentsTrendChart({
 totalAmount,
 prevAmount,
 deltaPercent,
 points,
}: Props) {
 return (
 <div className="rounded-2xl border border-border bg-card p-6 shadow-xl">
 <div className="flex flex-wrap items-center justify-between border-b border-border pb-4 gap-4">
 <div>
 <h2 className="text-lg font-normal text-foreground">Payments trend · Monthly</h2>
 <p className="text-xs text-muted-foreground">Current period vs previous</p>
 </div>

 <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-sans tabular-nums font-bold text-amber-400">
 ▲ {deltaPercent}%
 </span>
 </div>

 <div className="mt-6 h-48 w-full flex items-end gap-1.5 pt-4">
 {points.map((p) => {
 const barHeightPercent = Math.min(
 100,
 Math.max(5, (p.currentAmount / CHART_MAX_VAL) * 100)
 );
 return (
 <div key={p.day} className="flex-1 flex flex-col items-center gap-2 group relative">
 <div className="absolute -top-8 hidden rounded bg-secondary px-2 py-1 text-[10px] font-sans tabular-nums text-foreground group-hover:block z-10 whitespace-nowrap">
 Day {p.day}: Ksh {p.currentAmount.toLocaleString()}
 </div>

 <div
 className="w-full rounded-t bg-gradient-to-t from-amber-600/50 to-amber-500 transition-all hover:brightness-125"
 style={{ height: `${barHeightPercent}%` }}
 />
 <span className="text-[9px] font-sans tabular-nums text-muted-foreground">{p.day}</span>
 </div>
 );
 })}
 </div>

 <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-xs font-sans tabular-nums text-muted-foreground">
 <div>
 This period: <strong className="text-foreground">Ksh {totalAmount.toLocaleString()}</strong>
 </div>
 <div>
 Prev: <span className="text-muted-foreground">Ksh {prevAmount.toLocaleString()}</span>
 </div>
 </div>
 </div>
 );
}