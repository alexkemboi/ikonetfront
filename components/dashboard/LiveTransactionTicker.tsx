import React from "react";
import { Activity, AlertTriangle, CheckCircle2, CircleHelp, CircleX } from "lucide-react";
import { LivePaymentTicker, RouterTrafficItem } from "@/lib/types/dashboard";

interface Props {
 ticker: LivePaymentTicker;
 routerTraffic: RouterTrafficItem[];
}

export function LiveTransactionTicker({ ticker, routerTraffic }: Props) {
 const servingRouters = routerTraffic.filter((router) => router.activeSessions > 0);
 const noRouters = ticker.totalRouters <= 0;
 const allHealthy = !noRouters && ticker.healthyRouters === ticker.totalRouters;
 const someHealthy = ticker.healthyRouters > 0;
 const healthClass = noRouters
  ? "text-muted-foreground"
  : allHealthy
   ? "text-emerald-400"
   : someHealthy
	? "text-amber-400"
	: "text-destructive";
 const HealthIcon = noRouters
  ? CircleHelp
  : allHealthy
   ? CheckCircle2
   : someHealthy
	? AlertTriangle
	: CircleX;

 return (
 <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-5 py-3">
 {/* Live Stream item */}
 <div className="flex items-center gap-3 text-sm">
 <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-500/15 px-2.5 py-0.5 text-xs font-sans tabular-nums font-bold tracking-wider text-amber-400 uppercase">
 <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
 LIVE
 </span>
 <span className="text-zinc-200">
 Payment of <strong className="font-semibold text-foreground">Ksh {ticker.amount}</strong> from{" "}
 <strong className="font-sans tabular-nums text-amber-400">{ticker.account}</strong>
 </span>
 <span className="text-xs text-muted-foreground">· {ticker.timeAgo}</span>
 </div>

 {/* Router Health Status */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-sans tabular-nums">
       <div role="status" className={`flex items-center gap-2 ${healthClass}`}>
         <HealthIcon className="h-4 w-4" aria-hidden="true" />
         <span>{noRouters ? "No routers reported" : `${ticker.healthyRouters}/${ticker.totalRouters} routers healthy`}</span>
       </div>
       {servingRouters.length > 0 && <div role="status" className="flex items-center gap-2 text-emerald-400">
         <Activity className="h-4 w-4" aria-hidden="true" />
         <span>{servingRouters.map((router) => `${router.routerName} · ${router.activeSessions} active sessions`).join("; ")}</span>
       </div>}
      </div>
 </div>
 );
}