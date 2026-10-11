"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";
import type { RouterOverview } from "@/lib/types/network";
import { formatBytes, formatMoney } from "./format";

const BAND_TEXT: Record<string, string> = {
  GOOD: "text-emerald-600 dark:text-emerald-400",
  FAIR: "text-amber-600 dark:text-amber-400",
  POOR: "text-red-600 dark:text-red-400",
};

function Tile({ label, children, note }: { label: string; children: React.ReactNode; note: React.ReactNode }) {
  return (
    <div className="min-w-0 border-border p-4 [&:not(:first-child)]:border-t sm:[&:not(:first-child)]:border-t-0 lg:border-l lg:first:border-l-0">
      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1.5 text-2xl font-semibold tabular-nums text-foreground">{children}</div>
      <div className="mt-1 text-xs text-muted-foreground">{note}</div>
    </div>
  );
}

/** The six headline figures of a router, as on the reference screens. */
export function RouterFigures({ overview }: { overview: RouterOverview }) {
  const { figures, health } = overview;
  const data = formatBytes(figures.dataThisMonthBytes);
  const daily = figures.revenueDaily;
  return (
    <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-border bg-card sm:grid-cols-2 lg:grid-cols-6">
      <Tile label="Registered users" note={`have used this router · ${figures.registeredUsersDays} days`}>
        {figures.registeredUsers.toLocaleString()}
      </Tile>
      <Tile
        label="Active users"
        note={
          figures.activeUsers == null
            ? "not linked to a NAS device"
            : `online now · ${figures.activePppoe ?? 0} PPPoE · ${figures.activeHotspot ?? 0} hotspot`
        }
      >
        {figures.activeUsers ?? "—"}
      </Tile>
      <Tile label="Data this month" note="upload + download">
        {data.value} <span className="text-sm font-normal text-muted-foreground">{data.unit}</span>
      </Tile>
      <Tile
        label="Revenue this month"
        note={
          daily.length > 1 ? (
            <div className="h-8 w-full" aria-label="Revenue per day this month">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={daily} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                  <Tooltip
                    cursor={false}
                    labelFormatter={(_, payload) => String(payload?.[0]?.payload?.day ?? "")}
                    formatter={(v) => [`${figures.currency} ${formatMoney(Number(v))}`, "Revenue"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="var(--primary)"
                    fill="var(--primary)"
                    fillOpacity={0.15}
                    strokeWidth={2}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            `${figures.currency} · this month`
          )
        }
      >
        <span className="text-sm font-normal text-muted-foreground">{figures.currency}</span>{" "}
        {formatMoney(figures.revenueThisMonth)}
      </Tile>
      <Tile label="Uptime · 30 days" note="answers from the server">
        {figures.uptime30dPct != null ? (
          <>
            {figures.uptime30dPct}
            <span className="text-sm font-normal text-muted-foreground">%</span>
          </>
        ) : (
          "—"
        )}
      </Tile>
      <Tile
        label="Health"
        note={
          health.score == null ? "no readings to score" : <span className={BAND_TEXT[health.band]}>{health.band.toLowerCase()}</span>
        }
      >
        {health.score ?? "—"}
        {health.score != null && <span className="text-sm font-normal text-muted-foreground"> / 100</span>}
      </Tile>
    </div>
  );
}
