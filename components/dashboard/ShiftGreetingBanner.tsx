import React from "react";
import { Sparkles } from "lucide-react";

interface Props {
  tenantName: string;
  onlineCount: number;
  shiftName: string;
  expiriesCount: number;
  smsCreditLow: boolean;
  lastHourTrafficGb: number;
}

export function ShiftGreetingBanner({
  tenantName,
  onlineCount,
  shiftName,
  expiriesCount,
  smsCreditLow,
  lastHourTrafficGb,
}: Props) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#262626] bg-[#161616] p-6 shadow-2xl">
      {/* Subtle top amber glow */}
      <div className="absolute -left-20 -top-20 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
        <div>
          {/* Top metadata strip */}
          <div className="flex items-center gap-2 text-xs font-mono tracking-wider text-zinc-400 uppercase">
            <span>{tenantName}</span>
            <span className="text-zinc-600">—</span>
            <span className="font-semibold text-amber-400">{onlineCount} ONLINE RIGHT NOW</span>
            <span className="text-zinc-600">—</span>
            <span>{shiftName}</span>
          </div>

          {/* Warm Editorial Heading */}
          <h1 className="mt-2 text-3xl font-serif tracking-tight text-white sm:text-4xl">
            Good morning,{" "}
            <span className="text-amber-500 font-sans font-medium lowercase">
              {tenantName.replace(/\s+/g, "")}.
            </span>
          </h1>

          {/* Subtitle Alerts */}
          <p className="mt-2 text-sm text-zinc-300">
            <strong className="font-medium text-white">{expiriesCount} expiries</strong> due in 24h{" "}
            {smsCreditLow && (
              <>
                · <span className="font-semibold text-white">SMS credit low</span>
              </>
            )}{" "}
            — a few things need a minute.
          </p>

          <div className="mt-3 flex items-center gap-2 text-xs italic text-zinc-400">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>A fresh start — make it a good one.</span>
          </div>
        </div>

        {/* Live Traffic Last Hour Sparkline */}
        <div className="flex flex-col items-end justify-center rounded-xl border border-[#262626] bg-[#121212] px-6 py-4">
          <span className="text-[11px] font-mono tracking-wider text-zinc-400 uppercase">
            TRAFFIC · LAST HOUR
          </span>
          <div className="mt-2 flex items-baseline gap-3">
            {/* Inline SVG Sparkline */}
            <svg className="h-8 w-28 overflow-visible" viewBox="0 0 100 30">
              <path
                d="M0 20 Q 20 22, 40 18 T 70 15 T 85 2 T 100 24"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-lg font-mono font-semibold text-white">
              {lastHourTrafficGb.toFixed(1)} GB <span className="text-xs text-zinc-400 font-normal">moved</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}