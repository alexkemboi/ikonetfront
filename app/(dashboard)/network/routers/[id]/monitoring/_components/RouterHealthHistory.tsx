"use client";

import { useEffect, useState } from "react";
import {
  Area, AreaChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Activity, AlertTriangle, Cpu, Gauge, ShieldCheck, Timer } from "lucide-react";
import { getRouterReachability, getRouterSeries } from "@/actions/network";
import type { RouterReachability, RouterSeries, RouterSeriesRange } from "@/lib/types/network";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RouterOutages } from "@/components/network/RouterOutages";

const RANGES: RouterSeriesRange[] = ["1h", "24h", "7d", "30d"];
const REFRESH_MS = 60_000;
const GRID = "rgba(120, 120, 120, 0.15)";

function formatBps(value: number | null | undefined): string {
  const n = value ?? 0;
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)} Gbps`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} Mbps`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} kbps`;
  return `${n} bps`;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

function tickFormatter(range: RouterSeriesRange) {
  return (value: string) => {
    const date = new Date(value);
    return range === "7d" || range === "30d"
      ? date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
      : date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  };
}

const fullTime = (value: unknown) => new Date(String(value)).toLocaleString();

/**
 * History behind the live tiles: bucketed charts for a chosen range, and the uptime
 * strip with outage incidents. Outages are recorded from the release that added them,
 * so earlier days show as "no data" rather than as up.
 */
export function RouterHealthHistory({ routerId }: { routerId: number }) {
  const [range, setRange] = useState<RouterSeriesRange>("24h");
  const [series, setSeries] = useState<RouterSeries | null>(null);
  const [seriesError, setSeriesError] = useState("");
  const [reach, setReach] = useState<RouterReachability | null>(null);
  const [reachError, setReachError] = useState("");
  /** When the uptime data was loaded: the right-hand edge of the hourly strip. */
  const [loadedAt, setLoadedAt] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [s, r] = await Promise.all([getRouterSeries(routerId, range), getRouterReachability(routerId, 7)]);
      if (cancelled) return;
      setSeriesError(s.error ?? "");
      if (s.data) setSeries(s.data);
      setReachError(r.error ?? "");
      if (r.data) setReach(r.data);
      setLoadedAt(Date.now());
    };
    void load();
    const timer = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [routerId, range]);

  const points = series?.range === range ? series.points : [];
  const hasBandwidth = points.some((p) => p.wanRxBps != null);
  const formatTick = tickFormatter(range);

  // One cell per hour of the last 7 days; hours without any row are "no data".
  const statusByHour = new Map((reach?.hours ?? []).map((h) => [new Date(h.at).getTime(), h.status]));
  const thisHour = Math.floor((loadedAt ?? 0) / 3_600_000) * 3_600_000;
  const cells = loadedAt == null ? [] : Array.from({ length: 168 }, (_, i) => {
    const at = thisHour - (167 - i) * 3_600_000;
    return { at, status: statusByHour.get(at) ?? "NO_DATA" };
  });
  const cellColor: Record<string, string> = {
    UP: "bg-emerald-500",
    PARTIAL: "bg-amber-500",
    DOWN: "bg-red-500",
    NO_DATA: "bg-muted",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-normal">History</h2>
        <div role="tablist" aria-label="History range" className="inline-flex rounded-lg border border-border p-1">
          {RANGES.map((r) => (
            <button
              key={r}
              role="tab"
              aria-selected={range === r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 text-sm rounded-md ${range === r ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {seriesError && <p role="alert" className="text-sm text-destructive">{seriesError}</p>}
      {!seriesError && series && points.length === 0 && (
        <p className="text-sm text-muted-foreground">No readings were collected in this period.</p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Activity className="h-4 w-4 text-primary" /> Internet link bandwidth</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {hasBandwidth ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={points} margin={{ left: 10, right: 10, top: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                  <XAxis dataKey="at" tickFormatter={formatTick} className="text-xs" minTickGap={40} />
                  <YAxis tickFormatter={(v: number) => formatBps(v)} className="text-xs" width={70} />
                  <Tooltip labelFormatter={fullTime} formatter={(v) => formatBps(Number(v))} />
                  <Legend />
                  <Area type="monotone" dataKey="wanRxBps" name="Download" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} strokeWidth={2} connectNulls={false} />
                  <Area type="monotone" dataKey="wanTxBps" name="Upload" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={2} connectNulls={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">
                No link readings in this period. They are taken from the router&apos;s &quot;ibs-wan&quot; interface list, which routers linked through ZTP have.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Cpu className="h-4 w-4 text-primary" /> CPU, memory and disk</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={points} margin={{ left: -10, right: 10, top: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                <XAxis dataKey="at" tickFormatter={formatTick} className="text-xs" minTickGap={40} />
                <YAxis domain={[0, 100]} unit="%" className="text-xs" />
                <Tooltip labelFormatter={fullTime} formatter={(v) => `${v}%`} />
                <Legend />
                <Line type="monotone" dataKey="cpuPct" name="CPU" stroke="#ef4444" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="memoryPct" name="Memory" stroke="#f59e0b" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="diskPct" name="Disk" stroke="#6b7280" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Timer className="h-4 w-4 text-primary" /> Latency from the server</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={points} margin={{ left: -10, right: 10, top: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                <XAxis dataKey="at" tickFormatter={formatTick} className="text-xs" minTickGap={40} />
                <YAxis unit="ms" className="text-xs" />
                <Tooltip labelFormatter={fullTime} formatter={(v) => `${v} ms`} />
                <Area type="monotone" dataKey="latencyMs" name="Round trip" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-primary" /> Packet loss</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={points} margin={{ left: -10, right: 10, top: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                <XAxis dataKey="at" tickFormatter={formatTick} className="text-xs" minTickGap={40} />
                <YAxis domain={[0, 100]} unit="%" className="text-xs" />
                <Tooltip labelFormatter={fullTime} formatter={(v) => `${v}%`} />
                <Area type="monotone" dataKey="packetLossPct" name="Loss" stroke="#ef4444" fill="#ef4444" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border shadow-sm">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Reachability · last 7 days</CardTitle>
          {reach && (
            <div className="flex items-center gap-6 text-sm">
              <span className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-semibold tabular-nums text-emerald-600">
                  {reach.uptimePct != null ? `${reach.uptimePct}%` : "—"}
                </span>
                <span className="text-muted-foreground">uptime</span>
              </span>
              <span className="text-muted-foreground tabular-nums">
                {reach.incidentCount} {reach.incidentCount === 1 ? "incident" : "incidents"} · {formatDuration(reach.downtimeSeconds)} down
              </span>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-5">
          {reachError && <p role="alert" className="text-sm text-destructive">{reachError}</p>}
          <div className="flex gap-px" aria-label="Hourly reachability, oldest on the left">
            {cells.map((cell) => (
              <div
                key={cell.at}
                title={`${new Date(cell.at).toLocaleString()} · ${cell.status === "NO_DATA" ? "no data" : cell.status.toLowerCase()}`}
                className={`h-10 flex-1 rounded-[1px] ${cellColor[cell.status]}`}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            {[["Up", "bg-emerald-500"], ["Partial", "bg-amber-500"], ["Down", "bg-red-500"], ["No data", "bg-muted"]].map(([label, color]) => (
              <span key={label} className="flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-sm ${color}`} />{label}</span>
            ))}
          </div>
          <div>
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Recent incidents</h3>
            {reach && reach.incidents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No outages recorded in this period.</p>
            ) : (
              <ul className="space-y-2">
                {(reach?.incidents ?? []).map((incident) => (
                  <li key={incident.startedAt} className="flex flex-wrap items-center gap-3 text-sm">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${incident.ongoing ? "bg-red-500/10 text-red-600" : "bg-amber-500/10 text-amber-700"}`}>
                      {incident.ongoing ? "Down now" : "Recovered"}
                    </span>
                    <span className="tabular-nums">
                      {new Date(incident.startedAt).toLocaleString()} — {incident.recoveredAt ? new Date(incident.recoveredAt).toLocaleTimeString() : "ongoing"}
                    </span>
                    <span className="text-muted-foreground tabular-nums">({formatDuration(incident.durationSeconds)})</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>

      <RouterOutages routerId={routerId} />
    </div>
  );
}
