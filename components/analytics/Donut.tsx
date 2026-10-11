"use client";

import type { ReactNode } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

export interface DonutSlice {
  code: string;
  label: string;
  value: number;
  color: string;
  /** shown in the tooltip */
  display: string;
}

/** Part-of-a-whole for a handful of categories; the total sits in the middle and every slice is listed beside it. */
export function Donut({ slices, center, caption }: { slices: DonutSlice[]; center: ReactNode; caption: string }) {
  const drawn = slices.filter((slice) => slice.value > 0);
  return (
    <div className="relative mx-auto size-40 shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          {/* an empty ring keeps the shape when nothing was recorded */}
          <Pie data={[{ value: 1 }]} dataKey="value" innerRadius={52} outerRadius={72} fill="var(--muted)" stroke="none" isAnimationActive={false} />
          {drawn.length > 0 && (
            <Pie
              data={drawn}
              dataKey="value"
              nameKey="label"
              innerRadius={52}
              outerRadius={72}
              startAngle={90}
              endAngle={-270}
              paddingAngle={drawn.length > 1 ? 2 : 0}
              stroke="var(--card)"
              strokeWidth={2}
              isAnimationActive={false}
            >
              {drawn.map((slice) => (
                <Cell key={slice.code} fill={slice.color} />
              ))}
            </Pie>
          )}
          <Tooltip
            content={({ active, payload }) => {
              const slice = payload?.[0]?.payload as DonutSlice | undefined;
              if (!active || !slice?.code) return null;
              return (
                <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
                  <span className="mr-2 inline-block size-2 rounded-sm" style={{ background: slice.color }} />
                  {slice.label}: <span className="tabular-nums">{slice.display}</span>
                </div>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-sm font-semibold tabular-nums text-foreground">{center}</span>
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{caption}</span>
      </div>
    </div>
  );
}
