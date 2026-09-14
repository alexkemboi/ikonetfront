import React from "react";
import { RouterTrafficItem } from "@/lib/types/dashboard";

interface Props {
 items: RouterTrafficItem[];
 healthyRouters?: number;
 totalRouters?: number;
}

export function RouterTrafficCard({ items, healthyRouters, totalRouters }: Props) {
 return (
 <div className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-xl">
 <div className="flex items-center justify-between border-b border-border pb-4">
 <div>
 <h2 className="text-lg font-normal text-foreground">Where the traffic is</h2>
 <p className="text-xs text-muted-foreground">Busiest routers · last hour</p>
 </div>
 <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-sans tabular-nums text-emerald-400">
 {healthyRouters ?? items.length}/{totalRouters ?? items.length} healthy
 </span>
 </div>

 <div className="mt-6 space-y-6">
 {items.map((r) => (
 <div key={r.id}>
 <div className="flex items-baseline justify-between text-sm">
 <span className="font-semibold text-foreground">{r.routerName}</span>
 <span className="font-sans tabular-nums text-xs text-amber-400">
 {r.trafficSharePercent}% of live sessions
 </span>
 </div>

 <div className="mt-1.5 text-xs text-muted-foreground">
 {r.activeSessions} sessions · <span className="font-sans tabular-nums text-muted-foreground">{r.dataTransferredGb} GB</span>
 </div>

 {/* Progress Bar */}
 <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-secondary">
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