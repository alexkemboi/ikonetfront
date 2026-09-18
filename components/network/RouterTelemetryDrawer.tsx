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
  getNetworkDeviceInterfaces,
} from "@/actions/network";
import type { RouterHealthSnapshot } from "@/lib/types/network";
import type { MikrotikInterface } from "@/lib/types/mikrotik";

type Tab = "vitals" | "interfaces" | "sessions";

interface TelemetryRouter {
  /** network_device.id — used for the interfaces fetch. */
  id: string | number;
  /** network_routers.idxno — used for the telemetry latest/live fetch. */
  routerId?: number;
  name: string;
  managementIp?: string;
  vpnIp?: string;
  winboxTunnelAddress?: string | null;
}

const POLL_MS = 5000;
const CONNECT_MS = 10000;

function formatBytes(bytes: string | number): string {
  const n = typeof bytes === "string" ? Number(bytes) || 0 : bytes;
  if (n >= 1073741824) return `${(n / 1073741824).toFixed(2)} GiB`;
  if (n >= 1048576) return `${(n / 1048576).toFixed(1)} MiB`;
  if (n >= 1024) return `${(n / 1024).toFixed(0)} KiB`;
  return `${n} B`;
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

  const deviceId = Number(router.id);
  const telemetryRouterId = Number(router.routerId) || deviceId;
  const hasNumericDevice = Number.isFinite(deviceId) && deviceId > 0;
  const hasNumericRouter = Number.isFinite(telemetryRouterId) && telemetryRouterId > 0;

  // ── Live telemetry: SSE via the same-origin relay, fall back to /latest polling ──
  useEffect(() => {
    if (!hasNumericRouter) {
      setMode("offline");
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
        const snap = await getRouterMonitoringLatest(telemetryRouterId);
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
  }, [hasNumericRouter, telemetryRouterId]);

  // ── Interfaces (fetched on demand; refresh button re-fetches) ──
  const loadInterfaces = useCallback(async () => {
    if (!hasNumericDevice) return;
    setLoadingInterfaces(true);
    try {
      const rows = await getNetworkDeviceInterfaces(deviceId);
      setInterfaces(rows as unknown as MikrotikInterface[]);
    } finally {
      setLoadingInterfaces(false);
    }
  }, [hasNumericDevice, deviceId]);

  useEffect(() => {
    if (tab === "interfaces") loadInterfaces();
  }, [tab, loadInterfaces]);

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
                  mode === "offline"
                    ? "bg-destructive/10 text-destructive border-destructive/20"
                    : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                }`}
              >
                {mode === "streaming"
                  ? "LIVE"
                  : mode === "polling"
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
              Live telemetry requires a numeric router id. This row is a local
              placeholder; once it has been onboarded via the backend it will
              stream live data here.
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
                    {latest?.temperature != null ? `${latest.temperature}°C` : "—"}
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

          {hasNumericDevice && tab === "interfaces" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-medium">
                  Interfaces on device#{deviceId}
                </p>
                <button
                  onClick={loadInterfaces}
                  disabled={loadingInterfaces}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingInterfaces ? "animate-spin" : ""}`} />
                  Refresh
                </button>
              </div>
              {loadingInterfaces && !interfaces.length ? (
                <p className="text-xs text-muted-foreground py-6 text-center">Loading interfaces...</p>
              ) : interfaces.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">
                  No interface data returned. Verify the device is reachable via API.
                </p>
              ) : (
                interfaces.map((iface) => (
                  <div
                    key={iface[".id"] ?? iface.name}
                    className="flex items-center justify-between rounded-xl border border-border bg-card p-3 text-xs"
                  >
                    <div>
                      <div className="font-semibold flex items-center gap-2">
                        {iface.running === "true" ? (
                          <Network className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Network className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                        {iface.name}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-sans tabular-nums mt-0.5">
                        {iface.type}
                        {iface["mac-address"] ? ` · ${iface["mac-address"]}` : ""}
                      </div>
                    </div>
                    <div className="text-right font-sans tabular-nums">
                      <div className="text-emerald-600">▲ {formatBytes(iface["tx-byte"] ?? 0)}</div>
                      <div className="text-blue-600">▼ {formatBytes(iface["rx-byte"] ?? 0)}</div>
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
                        {latest?.activePppoeSessions ?? 0}
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
                        {latest?.activeHotspotSessions ?? 0}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed rounded-lg border border-border bg-card p-3">
                Per-subscriber drill-down (username, MAC, framed-IP, rate-limit) is a
                follow-up {'\u2014'} the router-scoped session detail endpoint isn{"'"}t wired yet.
                Counts above are live from the telemetry stream.
              </p>
            </div>
          )}
        </div>

        {/* Footer action */}
        <div className="border-t border-border px-6 py-4">
          <p className="text-[11px] text-muted-foreground">
            {mode === "streaming"
              ? "Streaming live via SSE · auto-fallback to polling on disconnect."
              : mode === "polling"
                ? "Polling /latest every 5s — SSE relay unavailable."
                : "Device unreachable or not yet onboarded."}
          </p>
        </div>
      </div>
    </div>
  );
}