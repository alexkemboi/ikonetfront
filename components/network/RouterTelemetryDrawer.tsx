"use client";

import { useCallback, useEffect, useState } from "react";
import {
  X,
  Cpu,
  HardDrive,
  Thermometer,
  Clock,
  Users,
  Network,
  RefreshCw,
  Shield,
  Activity,
  Wifi,
} from "lucide-react";
import {
  getRouterMonitoringLatest,
  getRouterLiveInterfaces,
  getRouterLiveSessions,
} from "@/actions/network";
import type {
  RouterHealthSnapshot,
  RouterLiveInterface,
  RouterLiveSessions,
} from "@/lib/types/network";
import { formatBytes } from "@/lib/utils/formatBytes";

type Tab = "vitals" | "interfaces" | "sessions";

interface TelemetryRouter {
  /** network_device.id — used for the interfaces fetch. */
  deviceId?: number;
  /** network_routers.idxno — used for the telemetry latest/live fetch. */
  routerId?: number;
  name: string;
  managementIp?: string;
  vpnIp?: string;
  winboxTunnelAddress?: string | null;
  links?: {
    telemetryLatest: string | null;
    deviceInterfaces: string | null;
  };
}

const POLL_MS = 5000;
const CONNECT_MS = 10000;
/** Interfaces carry a one-second traffic sample, so 5s keeps rates current. */
const INTERFACES_POLL_MS = 5000;
const SESSIONS_POLL_MS = 15000;

function formatBytes(bytes: string | number | null | undefined): string {
  const n = typeof bytes === "string" ? Number(bytes) || 0 : bytes ?? 0;
  if (n >= 1073741824) return `${(n / 1073741824).toFixed(2)} GiB`;
  if (n >= 1048576) return `${(n / 1048576).toFixed(1)} MiB`;
  if (n >= 1024) return `${(n / 1024).toFixed(0)} KiB`;
  return `${n} B`;
}

function formatBps(bps: number | null | undefined): string {
  const n = bps ?? 0;
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)} Gbps`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} Mbps`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} kbps`;
  return `${n} bps`;
}

/**
 * Polls a live router read while `enabled`. Keeps the last good rows on a
 * failed refresh so a single slow reply doesn't blank the table.
 */
function useLivePoll<T>(
  enabled: boolean,
  intervalMs: number,
  load: () => Promise<{ data: T; error: string | null }>
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await load();
      setError(res.error);
      if (!res.error) setData(res.data);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }, [load]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const loop = async () => {
      await refresh();
      if (!cancelled) timer = setTimeout(loop, intervalMs);
    };
    void loop();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [enabled, intervalMs, refresh]);

  return { data, error, loading, refresh };
}

export function RouterTelemetryDrawer({
  router,
  defaultTab,
  onClose,
}: {
  router: TelemetryRouter;
  defaultTab: Tab;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>(defaultTab);
  const [latest, setLatest] = useState<RouterHealthSnapshot | null>(null);
  const [mode, setMode] = useState<"streaming" | "polling" | "offline">("streaming");
  const [interfaces, setInterfaces] = useState<MikrotikInterface[]>([]);
  const [loadingInterfaces, setLoadingInterfaces] = useState(false);

  const deviceId = Number(router.deviceId);
  const telemetryRouterId = Number(router.routerId);
  const hasNumericDevice = Number.isFinite(deviceId) && deviceId > 0;
  const hasNumericRouter = Number.isFinite(telemetryRouterId) && telemetryRouterId > 0;

  const loadInterfaces = useCallback(
    () => getRouterLiveInterfaces(telemetryRouterId),
    [telemetryRouterId]
  );
  const liveInterfaces = useLivePoll<RouterLiveInterface[]>(
    hasNumericRouter && tab === "interfaces",
    INTERFACES_POLL_MS,
    loadInterfaces
  );
  const loadSessions = useCallback(
    async () => {
      const res = await getRouterLiveSessions(telemetryRouterId);
      return { data: res.data ?? { pppoe: [], hotspot: [] }, error: res.error };
    },
    [telemetryRouterId]
  );
  const liveSessions = useLivePoll<RouterLiveSessions>(
    hasNumericRouter && tab === "sessions",
    SESSIONS_POLL_MS,
    loadSessions
  );
  const interfaces = liveInterfaces.data ?? [];
  const displayMode = hasNumericRouter ? mode : "offline";

  // ── Live telemetry: SSE via the same-origin relay, fall back to /latest polling ──
  useEffect(() => {
    if (!hasNumericRouter) {
      return;
    }

    let cancelled = false;
    let source: EventSource | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let reconnectTimer: ReturnType<typeof setInterval> | null = null;
    let connectTimer: ReturnType<typeof setTimeout> | null = null;
    let stallTimer: ReturnType<typeof setTimeout> | null = null;
    let inFlight = false;

    const apply = (snap: RouterHealthSnapshot) => {
      if (cancelled) return;
      setLatest(snap);
      setMode("streaming");
    };

    const tick = async () => {
      if (cancelled || inFlight) return;
      inFlight = true;
      try {
        const snap = await getRouterMonitoringLatest(telemetryRouterId, router.links?.telemetryLatest);
        if (!cancelled) {
          if (snap) {
            apply(snap);
            setMode("polling");
          } else {
            setMode("offline");
          }
        }
      } catch {
        if (!cancelled) setMode("offline");
      } finally {
        inFlight = false;
      }
    };

    const stopTimers = () => {
      if (pollTimer) clearInterval(pollTimer);
      if (reconnectTimer) clearInterval(reconnectTimer);
      if (connectTimer) clearTimeout(connectTimer);
      if (stallTimer) clearTimeout(stallTimer);
      pollTimer = reconnectTimer = null;
      connectTimer = stallTimer = null;
    };

    const startPolling = () => {
      setMode("polling");
      if (pollTimer) return;
      tick();
      pollTimer = setInterval(tick, POLL_MS);
    };

    const degradeToPolling = () => {
      source?.close();
      source = null;
      stopTimers();
      startPolling();
    };

    const startStreaming = () => {
      if (typeof window === "undefined" || !("EventSource" in window)) {
        startPolling();
        return;
      }
      setMode("streaming");
      stopTimers();
      source = new EventSource(`/api/monitoring/router/${telemetryRouterId}/live`);

      connectTimer = setTimeout(() => {
        if (source && source.readyState === EventSource.CONNECTING) {
          degradeToPolling();
        }
      }, CONNECT_MS);

      source.addEventListener("telemetry", (event) => {
        try {
          apply(
            JSON.parse((event as MessageEvent).data as string) as RouterHealthSnapshot
          );
        } catch {
          // Malformed frame — heartbeat keeps the stream alive.
        }
      });
      source.onerror = () => degradeToPolling();
    };

    startStreaming();

    return () => {
      cancelled = true;
      source?.close();
      stopTimers();
    };
  }, [hasNumericRouter, telemetryRouterId, router.links?.telemetryLatest]);

  // ── Interfaces (fetched on demand; refresh button re-fetches) ──
  const fetchInterfaces = useCallback(async (): Promise<MikrotikInterface[]> => {
    if (!hasNumericDevice) return [];
    const rows = await getNetworkDeviceInterfaces(deviceId, router.links?.deviceInterfaces);
    return rows as unknown as MikrotikInterface[];
  }, [hasNumericDevice, deviceId, router.links?.deviceInterfaces]);

  const loadInterfaces = useCallback(async () => {
    if (!hasNumericDevice) return;
    setLoadingInterfaces(true);
    try {
      setInterfaces(await fetchInterfaces());
    } finally {
      setLoadingInterfaces(false);
    }
  }, [hasNumericDevice, fetchInterfaces]);

  useEffect(() => {
    if (tab !== "interfaces" || !hasNumericDevice) return;
    let cancelled = false;
    void fetchInterfaces().then((rows) => {
      if (!cancelled) setInterfaces(rows);
    });
    return () => { cancelled = true; };
  }, [tab, hasNumericDevice, fetchInterfaces]);

  const memPct =
    latest && latest.totalMemory > 0
      ? Math.round(((latest.totalMemory - latest.freeMemory) / latest.totalMemory) * 100)
      : 0;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end"
      data-testid="telemetry-drawer"
    >
      <div className="w-full max-w-xl bg-background border-l border-border h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-normal flex items-center gap-2">
              {router.name}
              <span
                className={`text-[11px] font-sans tabular-nums px-2 py-0.5 rounded-full border ${
                  displayMode === "offline"
                    ? "bg-destructive/10 text-destructive border-destructive/20"
                    : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                }`}
              >
                {displayMode === "streaming"
                  ? "LIVE"
                  : displayMode === "polling"
                    ? "POLLING"
                    : "OFFLINE"}
              </span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5 font-sans tabular-nums">
              {router.managementIp || router.vpnIp || "—"}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close telemetry drawer"
            className="p-2 text-muted-foreground hover:text-foreground rounded-lg border border-border hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 py-3 border-b border-border" role="tablist">
          {(["vitals", "interfaces", "sessions"] as Tab[]).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
                tab === t
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {t === "vitals" ? "Hardware Vitals" : t}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto space-y-3 px-6 py-4">
          {!hasNumericRouter && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-600">
              This device isn{"'"}t linked to a router record, so live vitals,
              interfaces and sessions aren{"'"}t available. Re-run onboarding for
              this router to link it.
            </div>
          )}

          {hasNumericRouter && tab === "vitals" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span className="flex items-center gap-1.5">
                    <Cpu className="h-4 w-4 text-emerald-500" /> CPU Load
                  </span>
                  <span className="font-sans tabular-nums text-foreground font-bold">
                    {latest?.cpuUsage ?? "—"}%
                  </span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${Math.min(latest?.cpuUsage ?? 0, 100)}%` }}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span className="flex items-center gap-1.5">
                    <HardDrive className="h-4 w-4 text-blue-500" /> RAM Usage
                  </span>
                  <span className="font-sans tabular-nums text-foreground font-bold">{memPct}%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-500"
                    style={{ width: `${memPct}%` }}
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-muted-foreground font-sans tabular-nums">
                  {latest ? formatBytes(latest.freeMemory) : "—"} free
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
                  <Thermometer className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Board Temp</div>
                  <div className="text-lg font-bold font-sans tabular-nums">
                    {latest?.temperature != null ? (
                      `${latest.temperature}°C`
                    ) : (
                      <span className="text-sm font-normal text-muted-foreground">
                        {latest ? "No sensor" : "—"}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Uptime</div>
                  <div className="text-sm font-bold font-sans tabular-nums">{latest?.uptime ?? "—"}</div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Active PPPoE</div>
                    <div className="text-lg font-bold font-sans tabular-nums">
                      {latest?.activePppoeSessions ?? 0}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-sky-500/10 text-sky-500">
                    <Wifi className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Active Hotspot</div>
                    <div className="text-lg font-bold font-sans tabular-nums">
                      {latest?.activeHotspotSessions ?? 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {hasNumericRouter && tab === "interfaces" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-medium">
                  {interfaces.length > 0
                    ? `${interfaces.filter((i) => i.running).length} of ${interfaces.length} interfaces up · live from router`
                    : "Interfaces · live from router"}
                </p>
                <button
                  onClick={() => void liveInterfaces.refresh()}
                  disabled={liveInterfaces.loading}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${liveInterfaces.loading ? "animate-spin" : ""}`} />
                  Refresh
                </button>
              </div>
              {liveInterfaces.error && (
                <p className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                  {liveInterfaces.error}
                </p>
              )}
              {liveInterfaces.data === null && !liveInterfaces.error ? (
                <p className="text-xs text-muted-foreground py-6 text-center">Reading interfaces from the router...</p>
              ) : interfaces.length === 0 && !liveInterfaces.error ? (
                <p className="text-xs text-muted-foreground py-6 text-center">The router reported no interfaces.</p>
              ) : (
                interfaces.map((iface) => (
                  <div
                    key={iface.name}
                    className={`flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 text-xs ${
                      iface.disabled ? "opacity-60" : ""
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="font-semibold flex items-center gap-2">
                        <Network
                          className={`h-3.5 w-3.5 shrink-0 ${iface.running ? "text-emerald-500" : "text-muted-foreground"}`}
                        />
                        <span className="truncate">{iface.name}</span>
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                            iface.disabled
                              ? "bg-muted text-muted-foreground"
                              : iface.running
                                ? "bg-emerald-500/10 text-emerald-600"
                                : "bg-amber-500/10 text-amber-600"
                          }`}
                        >
                          {iface.disabled ? "disabled" : iface.running ? "up" : "down"}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground font-sans tabular-nums mt-0.5 truncate">
                        {iface.type ?? "—"}
                        {iface.macAddress ? ` · ${iface.macAddress}` : ""}
                        {iface.comment ? ` · ${iface.comment}` : ""}
                      </div>
                    </div>
                    <div className="text-right font-sans tabular-nums shrink-0">
                      <div className="text-emerald-600" title="Transmit rate (total sent)">
                        ▲ {iface.running ? formatBps(iface.txBitsPerSecond) : "—"}
                        <span className="ml-1 text-[10px] text-muted-foreground">{formatBytes(iface.txBytes)}</span>
                      </div>
                      <div className="text-blue-600" title="Receive rate (total received)">
                        ▼ {iface.running ? formatBps(iface.rxBitsPerSecond) : "—"}
                        <span className="ml-1 text-[10px] text-muted-foreground">{formatBytes(iface.rxBytes)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {hasNumericRouter && tab === "sessions" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">PPPoE Clients</div>
                      <div className="text-lg font-bold font-sans tabular-nums">
                        {liveSessions.data?.pppoe.length ?? latest?.activePppoeSessions ?? 0}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-sky-500/10 text-sky-500">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Hotspot Clients</div>
                      <div className="text-lg font-bold font-sans tabular-nums">
                        {liveSessions.data?.hotspot.length ?? latest?.activeHotspotSessions ?? 0}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-medium">Online now · live from router</p>
                <button
                  onClick={() => void liveSessions.refresh()}
                  disabled={liveSessions.loading}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${liveSessions.loading ? "animate-spin" : ""}`} />
                  Refresh
                </button>
              </div>

              {liveSessions.error && (
                <p className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                  {liveSessions.error}
                </p>
              )}

              {liveSessions.data === null && !liveSessions.error ? (
                <p className="text-xs text-muted-foreground py-6 text-center">Reading sessions from the router...</p>
              ) : liveSessions.data ? (
                <>
                  <SessionSection title="PPPoE" empty="No PPPoE subscribers online.">
                    {liveSessions.data.pppoe.map((s, i) => (
                      <div
                        key={`${s.username ?? "pppoe"}-${i}`}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="font-semibold truncate">
                            {s.customerName ? (
                              s.customerId ? (
                                <a href={`/customers/${s.customerId}`} className="hover:underline">
                                  {s.customerName}
                                </a>
                              ) : (
                                s.customerName
                              )
                            ) : (
                              <span>{s.username ?? "—"}</span>
                            )}
                          </div>
                          <div className="text-[11px] text-muted-foreground font-sans tabular-nums truncate">
                            {s.customerName ? `${s.username ?? "—"} · ` : ""}
                            {s.address ?? "no IP"}
                            {s.callerId ? ` · ${s.callerId}` : ""}
                            {!s.customerName ? " · not linked to a customer" : ""}
                          </div>
                        </div>
                        <div className="text-right text-[11px] text-muted-foreground font-sans tabular-nums shrink-0">
                          {s.uptime ?? "—"}
                        </div>
                      </div>
                    ))}
                  </SessionSection>
                  <SessionSection title="Hotspot" empty="No hotspot users online.">
                    {liveSessions.data.hotspot.map((s, i) => (
                      <div
                        key={`${s.macAddress ?? s.username ?? "hs"}-${i}`}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="font-semibold truncate">{s.username ?? s.macAddress ?? "—"}</div>
                          <div className="text-[11px] text-muted-foreground font-sans tabular-nums truncate">
                            {s.address ?? "no IP"}
                            {s.macAddress ? ` · ${s.macAddress}` : ""}
                            {s.loginBy ? ` · ${s.loginBy}` : ""}
                          </div>
                        </div>
                        <div className="text-right text-[11px] font-sans tabular-nums shrink-0">
                          <div className="text-muted-foreground">{s.uptime ?? "—"}</div>
                          <div className="text-emerald-600">▼ {formatBytes(s.bytesOut)}</div>
                          <div className="text-blue-600">▲ {formatBytes(s.bytesIn)}</div>
                        </div>
                      </div>
                    ))}
                  </SessionSection>
                </>
              ) : null}
            </div>
          )}
        </div>

        {/* Footer action */}
        <div className="border-t border-border px-6 py-4">
          <p className="text-[11px] text-muted-foreground">
            {displayMode === "streaming"
              ? "Vitals stream live as the router reports them."
              : displayMode === "polling"
                ? "Vitals refresh every 5 seconds."
                : "No telemetry received from this router yet."}
          </p>
        </div>
      </div>
    </div>
  );
}

function SessionSection({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: React.ReactNode[];
}) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title} <span className="font-sans tabular-nums">({children.length})</span>
      </p>
      {children.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
          {empty}
        </p>
      ) : (
        children
      )}
    </div>
  );
}
