import React from "react";
import type { DonutSegment } from "@/lib/types/analytics";

interface Props {
  revenueMix: DonutSegment[];
  paymentMethods: DonutSegment[];
}

const ARC_COLORS = ["#f59e0b", "#10b981", "#38bdf8", "#a78bfa", "#ef4444", "#71717a"];

const compactCurrency = (n: number) =>
  new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 0 }).format(n);

function Donut({ segments }: { segments: DonutSegment[] }) {
  const total = segments.reduce((sum, s) => sum + Math.abs(s.amount), 0);
  const pcts = segments.map((s) =>
    total > 0 ? (Math.abs(s.amount) / total) * 100 : 0
  );
  const cumulativePcts = pcts.reduce<number[]>((acc, pct) => {
    acc.push((acc.length ? acc[acc.length - 1] : 0) + pct);
    return acc;
  }, []);

  const arcs = segments.map((s, i) => ({
    s,
    pct: pcts[i],
    dashOffset: `-${i === 0 ? 0 : cumulativePcts[i - 1]}`,
    color: ARC_COLORS[i % ARC_COLORS.length],
  }));

  return (
    <div className="relative flex h-32 w-32 items-center justify-center">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
        <path
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="#262626"
          strokeWidth="4"
        />
        {arcs.map(({ s, pct, dashOffset, color }) => (
          <path
            key={s.name}
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeDasharray={`${Math.max(0, Math.min(100, pct))}, 100`}
            strokeDashoffset={dashOffset}
          />
        ))}
      </svg>
      <div className="absolute text-center">
        <span className="block font-mono text-xs font-bold text-white">
          Ksh {compactCurrency(total)}
        </span>
        <span className="text-[9px] font-mono text-zinc-500 uppercase">TOTAL</span>
      </div>
    </div>
  );
}

function Breakdown({ segments }: { segments: DonutSegment[] }) {
  return (
    <div className="flex-1 space-y-3 font-mono text-xs">
      {segments.map((s, i) => {
        const color = ARC_COLORS[i % ARC_COLORS.length];
        const dominant = s.percentage >= 100;
        return (
          <div key={s.name}>
            <div className="flex items-center justify-between">
              <span
                className={`flex items-center gap-2 ${dominant ? "text-white" : "text-zinc-400"}`}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />{" "}
                {s.name}
              </span>
              <span className={dominant ? "text-white font-bold" : "text-zinc-400"}>
                Ksh {s.amount.toLocaleString()}
              </span>
            </div>
            <div className="mt-1 text-[11px] text-zinc-500">
              {s.percentage}% · {s.count.toLocaleString()} payments
              {s.avgKsh > 0 ? ` · Ksh ${s.avgKsh} avg` : ""}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DonutCard({
  title,
  segments,
}: {
  title: string;
  segments: DonutSegment[];
}) {
  return (
    <div className="rounded-2xl border border-[#262626] bg-[#161616] p-6 shadow-xl">
      <div className="flex items-center justify-between border-b border-[#262626] pb-3">
        <h2 className="text-base font-semibold text-white">{title}</h2>
        <span className="font-mono text-xs text-zinc-400">
          Ksh{" "}
          {segments
            .reduce((sum, s) => sum + Math.abs(s.amount), 0)
            .toLocaleString()}{" "}
          total
        </span>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row items-center gap-8">
        <Donut segments={segments} />
        <Breakdown segments={segments} />
      </div>
    </div>
  );
}

export function RevenueMixDonuts({ revenueMix, paymentMethods }: Props) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <DonutCard title="Revenue mix · Monthly" segments={revenueMix} />
      <DonutCard title="Payment methods · Monthly" segments={paymentMethods} />
    </div>
  );
}
