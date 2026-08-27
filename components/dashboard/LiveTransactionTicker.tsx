import React from "react";
import { CheckCircle2 } from "lucide-react";
import { LivePaymentTicker } from "@/lib/types/dashboard";

interface Props {
  ticker: LivePaymentTicker;
}

export function LiveTransactionTicker({ ticker }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#262626] bg-[#161616] px-5 py-3">
      {/* Live Stream item */}
      <div className="flex items-center gap-3 text-sm">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-500/15 px-2.5 py-0.5 text-xs font-mono font-bold tracking-wider text-amber-400 uppercase">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
          LIVE
        </span>
        <span className="text-zinc-200">
          Payment of <strong className="font-semibold text-white">Ksh {ticker.amount}</strong> from{" "}
          <strong className="font-mono text-amber-400">{ticker.account}</strong>
        </span>
        <span className="text-xs text-zinc-400">· {ticker.timeAgo}</span>
      </div>

      {/* Router Health Status */}
      <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
        <CheckCircle2 className="h-4 w-4" />
        <span>
          {ticker.healthyRouters}/{ticker.totalRouters} routers healthy
        </span>
      </div>
    </div>
  );
}