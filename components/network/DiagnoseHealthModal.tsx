"use client";

import { X, Cpu, Clock, Thermometer, Globe, Activity, Shield, AlertTriangle } from "lucide-react";
import type { DiagnoseDetails } from "@/lib/types/network-router";
import { Button } from "@/components/ui/button";

interface DiagnoseHealthModalProps {
  routerName: string;
  details: DiagnoseDetails | null;
  message?: string;
  onClose: () => void;
}

function statusStyles(status?: string | null) {
  switch (status) {
    case "OK":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "DEGRADED":
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "WAN_DOWN":
      return "bg-red-500/10 text-red-400 border-red-500/20";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

/**
 * Track 1 — DIAGNOSE result modal. Renders the real RouterOS structured
 * `details` map returned by the action endpoint.
 */
export function DiagnoseHealthModal({
  routerName,
  details,
  message,
  onClose,
}: DiagnoseHealthModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      data-testid="diagnose-modal"
    >
      <div className="w-full max-w-lg bg-background border border-border rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-normal flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan-500" />
              Router Diagnostics
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5 font-sans tabular-nums">
              {routerName}
            </p>
          </div>
          <Button
            onClick={onClose}
            aria-label="Close diagnostics modal"
            variant="ghost"
            size="icon-sm"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {message ? (
            <p className="text-xs text-muted-foreground mb-4">{message}</p>
          ) : null}

          {!details ? (
            <p className="text-xs text-muted-foreground py-6 text-center">
              No diagnostic readings were returned.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-500">
                  <Cpu className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">CPU Load</div>
                  <div className="text-lg font-bold font-sans tabular-nums">
                    {details.cpuLoad != null ? `${details.cpuLoad}%` : "—"}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Uptime</div>
                  <div className="text-sm font-bold font-sans tabular-nums">
                    {details.uptime ?? "—"}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
                  <Thermometer className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Board Temp</div>
                  <div className="text-lg font-bold font-sans tabular-nums">
                    {details.temperature != null ? `${details.temperature}°C` : "—"}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">WAN Ping (8.8.8.8)</div>
                  <div className="text-lg font-bold font-sans tabular-nums">
                    {details.wanPingLatency ?? "—"}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Packet Loss</div>
                  <div className="text-lg font-bold font-sans tabular-nums">
                    {details.packetLoss ?? "—"}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">RADIUS</div>
                  <div className="text-lg font-bold font-sans tabular-nums">
                    {details.radiusStatus !== "NOT_CONFIGURED"
                      ? details.radiusStatus ?? "—"
                      : "Not configured"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {details && details.status ? (
            <div className="mt-4 flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
              <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" /> Overall health
              </span>
              <span
                className={`text-[11px] font-sans font-medium px-2.5 py-0.5 rounded-full border ${statusStyles(details.status)}`}
              >
                {details.status}
              </span>
            </div>
          ) : null}
        </div>

        <div className="border-t border-border px-6 py-4 text-right">
          <Button onClick={onClose} variant="secondary" size="sm">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}