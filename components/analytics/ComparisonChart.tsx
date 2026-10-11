"use client";

import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAmountsHidden } from "@/components/analytics/AmountsVisibility";

export interface ComparisonPoint {
  label: string;
  current: number;
  previous: number;
  /** left out of the chart when undefined */
  extra?: number;
  /** full description of the bucket for the tooltip */
  title?: string;
  previousTitle?: string;
}

/**
 * The page's one time-series form: bars for the selected period, a neutral line for
 * the comparison period, and optionally a dashed line for a third measure on the same
 * scale. One axis, shared by all three.
 */
export function ComparisonChart({
  points,
  format,
  formatAxis,
  currentLabel = "Current",
  previousLabel = "Previous",
  extraLabel,
  money = false,
  height = 240,
}: {
  points: ComparisonPoint[];
  format: (value: number) => string;
  formatAxis: (value: number) => string;
  currentLabel?: string;
  previousLabel?: string;
  extraLabel?: string;
  /** money charts hide their scale and values while amounts are hidden */
  money?: boolean;
  height?: number;
}) {
  const hidden = useAmountsHidden() && money;
  const show = (value: number) => (hidden ? "••••" : format(value));

  return (
    <div>
      <div style={{ height }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={points} margin={{ left: 4, right: 8, top: 8, bottom: 0 }} barCategoryGap="22%">
            <CartesianGrid vertical={false} stroke="var(--viz-grid)" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              minTickGap={24}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            />
            <YAxis
              width={48}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              tickFormatter={(value: number) => (hidden ? "" : formatAxis(value))}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            />
            <Tooltip
              cursor={{ fill: "var(--muted)", opacity: 0.5 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const point = payload[0].payload as ComparisonPoint;
                return (
                  <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
                    <p className="font-medium">{point.title ?? point.label}</p>
                    <p className="mt-1 flex items-center gap-2">
                      <span className="size-2 rounded-sm" style={{ background: "var(--viz-1)" }} />
                      {currentLabel}: <span className="tabular-nums">{show(point.current)}</span>
                    </p>
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <span className="h-0.5 w-2" style={{ background: "var(--viz-previous)" }} />
                      {previousLabel}
                      {point.previousTitle ? ` (${point.previousTitle})` : ""}: <span className="tabular-nums">{show(point.previous)}</span>
                    </p>
                    {extraLabel && point.extra !== undefined && (
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <span className="h-0.5 w-2" style={{ background: "var(--viz-2)" }} />
                        {extraLabel}: <span className="tabular-nums">{show(point.extra)}</span>
                      </p>
                    )}
                  </div>
                );
              }}
            />
            <Bar dataKey="current" name={currentLabel} fill="var(--viz-1)" radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} />
            <Line
              dataKey="previous"
              name={previousLabel}
              type="linear"
              stroke="var(--viz-previous)"
              strokeWidth={2}
              dot={points.length <= 31 ? { r: 3, fill: "var(--viz-previous)", stroke: "var(--card)", strokeWidth: 2 } : false}
              isAnimationActive={false}
            />
            {extraLabel && (
              <Line
                dataKey="extra"
                name={extraLabel}
                type="linear"
                stroke="var(--viz-2)"
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={false}
                isAnimationActive={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <li className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm" style={{ background: "var(--viz-1)" }} />
          {currentLabel}
        </li>
        <li className="flex items-center gap-1.5">
          <span className="h-0.5 w-3.5" style={{ background: "var(--viz-previous)" }} />
          {previousLabel}
        </li>
        {extraLabel && (
          <li className="flex items-center gap-1.5">
            <span className="w-3.5 border-t-2 border-dashed" style={{ borderColor: "var(--viz-2)" }} />
            {extraLabel}
          </li>
        )}
      </ul>
    </div>
  );
}
