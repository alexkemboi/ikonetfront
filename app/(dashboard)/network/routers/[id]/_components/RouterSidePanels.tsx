"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2, Circle, Copy, Eye, EyeOff, Gauge, RefreshCw, Server, ShieldCheck, Wifi,
} from "lucide-react";
import {
  getProvisioningChecklist,
  getRouterConnection,
  getRouterHotspot,
  getRouterServices,
  revealRouterSecrets,
  setRouterWinbox,
  updateRouterHotspot,
} from "@/actions/routerOperations";
import { executeRouterAction } from "@/actions/network";
import { withStepUp } from "@/lib/stepUp";
import type { LoginPageStatus, RouterHealthScore, RouterSecrets } from "@/lib/types/network";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDateTime, useOnDemand } from "./format";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 text-sm [&:not(:last-child)]:border-b border-border">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-right font-medium tabular-nums">{children}</span>
    </div>
  );
}

async function copy(value: string | null | undefined, what: string) {
  if (!value) return;
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${what} copied`);
  } catch {
    toast.error("Clipboard unavailable — copy it by hand.");
  }
}

function CopyButton({ value, what }: { value: string | null | undefined; what: string }) {
  if (!value) return null;
  return (
    <button type="button" aria-label={`Copy ${what}`} onClick={() => void copy(value, what)}
      className="ml-2 inline-flex rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
      <Copy className="h-3.5 w-3.5" />
    </button>
  );
}

const BAR: Record<string, string> = { GOOD: "bg-emerald-500", FAIR: "bg-amber-500", POOR: "bg-red-500" };

export function HealthCard({ health }: { health: RouterHealthScore }) {
  const meters: [string, number | null][] = [
    ["CPU load", health.cpuPct],
    ["Memory", health.memoryPct],
    ["Disk", health.diskPct],
  ];
  return (
    <Card className="border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base"><Gauge className="h-4 w-4 text-primary" /> Health</CardTitle>
        <span className="text-sm tabular-nums text-muted-foreground">{health.score == null ? "No readings" : `${health.score} / 100`}</span>
      </CardHeader>
      <CardContent className="space-y-4">
        {meters.map(([label, pct]) => (
          <div key={label}>
            <div className="flex justify-between text-sm"><span>{label}</span><span className="tabular-nums">{pct != null ? `${pct}%` : "—"}</span></div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className={`h-full ${BAR[(pct ?? 0) > 80 ? "POOR" : (pct ?? 0) > 60 ? "FAIR" : "GOOD"]}`} style={{ width: `${Math.min(pct ?? 0, 100)}%` }} />
            </div>
          </div>
        ))}
        <div>
          <Row label="Latency · 1 h">{health.latencyMs != null ? `${health.latencyMs} ms` : "—"}</Row>
          <Row label="Packet loss · 1 h">{health.packetLossPct != null ? `${health.packetLossPct}%` : "—"}</Row>
          <Row label="Uptime · 24 h">{health.uptime24hPct != null ? `${health.uptime24hPct}%` : "—"}</Row>
        </div>
        {health.deductions.length > 0 && (
          <div>
            <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Why not 100</h3>
            <ul className="space-y-1 text-sm">
              {health.deductions.map((d) => (
                <li key={d.reading} className="flex justify-between gap-2">
                  <span>{d.reading} <span className="text-muted-foreground">({d.value})</span></span>
                  <span className="tabular-nums text-muted-foreground">−{d.points}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Connection & RADIUS: login name, API port, RADIUS server, remote access, WinBox on/off.
 * The router password and RADIUS secret are revealed to SYSADMIN only, after step-up.
 */
export function ConnectionPanel({ routerId, canEdit }: { routerId: number; canEdit: boolean }) {
  const loadConnection = useCallback(() => getRouterConnection(routerId), [routerId]);
  const loadServices = useCallback(() => getRouterServices(routerId), [routerId]);
  const connection = useOnDemand(loadConnection, true);
  const services = useOnDemand(loadServices, true);
  const [secrets, setSecrets] = useState<RouterSecrets | null>(null);
  const [busy, setBusy] = useState(false);

  const c = connection.data;
  const winbox = services.data?.find((s) => s.name === "winbox");
  const www = services.data?.find((s) => s.name === "www");

  const reveal = async () => {
    if (secrets) {
      setSecrets(null);
      return;
    }
    setBusy(true);
    try {
      const res = await withStepUp(
        (token) => revealRouterSecrets(routerId, token),
        "Revealing router secrets is recorded. Re-authenticate to continue."
      );
      if (res.success && res.data) setSecrets(res.data);
      else toast.error(res.message);
    } finally {
      setBusy(false);
    }
  };

  const toggleWinbox = async () => {
    if (!winbox) return;
    const enable = winbox.disabled;
    if (!enable && !window.confirm("Turn WinBox off on this router? Nobody can open it in WinBox, including through the remote access tunnel, until it is turned back on.")) {
      return;
    }
    setBusy(true);
    try {
      const res = await setRouterWinbox(routerId, enable);
      if (res.success && res.data) {
        services.setData(res.data);
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base"><Server className="h-4 w-4 text-primary" /> Connection &amp; RADIUS</CardTitle>
        {c?.canRevealSecrets && (c.hasApiPassword || c.hasRadiusSecret) && (
          <Button size="sm" variant="outline" disabled={busy} onClick={() => void reveal()}>
            {secrets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {secrets ? "Hide" : "Reveal"}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {connection.error && <p role="alert" className="text-sm text-destructive">{connection.error}</p>}
        {c && (
          <div>
            <Row label="Web console">
              {c.webConsoleUrl ? (
                <a href={c.webConsoleUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">Open ↗</a>
              ) : (
                <span className="font-normal text-muted-foreground">open remote access first</span>
              )}
            </Row>
            <Row label="WinBox">
              {c.winboxEndpoint ? <>{c.winboxEndpoint}<CopyButton value={c.winboxEndpoint} what="WinBox address" /></> : "—"}
            </Row>
            {c.tunnelExpiresAt && <Row label="Remote access until">{formatDateTime(c.tunnelExpiresAt)}</Row>}
            <Row label="WinBox service">
              {services.error ? <span className="text-destructive font-normal">unreadable</span>
                : !winbox ? "—"
                : (
                  <span className="inline-flex items-center gap-2">
                    <span className={winbox.disabled ? "text-muted-foreground" : "text-emerald-600 dark:text-emerald-400"}>
                      {winbox.disabled ? "off" : "on"}
                    </span>
                    {canEdit && (
                      <Button size="sm" variant="outline" className="h-7" disabled={busy} onClick={() => void toggleWinbox()}>
                        {winbox.disabled ? "Turn on" : "Turn off"}
                      </Button>
                    )}
                  </span>
                )}
            </Row>
            <Row label="Web service">
              {www ? (
                <span title="Serves the hotspot login page, so it has no off switch here.">
                  {www.disabled ? "off" : "on"} <span className="font-normal text-muted-foreground">· serves the login page</span>
                </span>
              ) : "—"}
            </Row>
            <Row label="Username">{c.apiUsername ?? "—"}<CopyButton value={c.apiUsername} what="Username" /></Row>
            <Row label="Password">
              {secrets ? <>{secrets.apiPassword ?? "—"}<CopyButton value={secrets.apiPassword} what="Password" /></> : c.hasApiPassword ? "••••••••" : "—"}
            </Row>
            <Row label="API">{c.apiHost ?? "—"}:{c.apiPort ?? 8728}</Row>
            <Row label="RADIUS">{c.radiusServer ?? "—"}<CopyButton value={c.radiusServer} what="RADIUS address" /></Row>
            <Row label="Secret">
              {secrets ? <>{secrets.radiusSecret ?? "—"}<CopyButton value={secrets.radiusSecret} what="RADIUS secret" /></> : c.hasRadiusSecret ? "••••••••" : "—"}
            </Row>
            {!c.canRevealSecrets && (
              <p className="pt-2 text-xs text-muted-foreground">Only a system administrator can reveal the password and secret.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const PAGE_STATUS: Record<LoginPageStatus, { text: string; tone: string }> = {
  CURRENT: { text: "installed, current", tone: "text-emerald-600 dark:text-emerald-400" },
  OUTDATED: { text: "not our current page", tone: "text-amber-600 dark:text-amber-400" },
  MISSING: { text: "missing", tone: "text-red-600 dark:text-red-400" },
  NO_HOTSPOT: { text: "no hotspot set up", tone: "text-muted-foreground" },
  UNKNOWN: { text: "could not compare", tone: "text-muted-foreground" },
};

/** Hotspot servers, user timeouts and whether customers see our login page. */
export function HotspotPanel({ routerId, canEdit, actionUrl }: { routerId: number; canEdit: boolean; actionUrl?: string | null }) {
  const load = useCallback(() => getRouterHotspot(routerId), [routerId]);
  const hotspot = useOnDemand(load, true);
  const [busy, setBusy] = useState(false);
  const h = hotspot.data;

  const setTimeoutValue = async (field: "idleTimeout" | "keepaliveTimeout", value: string) => {
    setBusy(true);
    try {
      const res = await updateRouterHotspot(routerId, { [field]: value });
      if (res.success && res.data) {
        hotspot.setData(res.data);
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } finally {
      setBusy(false);
    }
  };

  const syncPage = async () => {
    setBusy(true);
    try {
      const res = await executeRouterAction(routerId, { action: "SYNC_HOTSPOT_FILES" }, undefined, actionUrl);
      const failed = !res.success || res.data?.executionStatus === "FAILED";
      toast[failed ? "error" : "success"](res.data?.message || res.message);
      void hotspot.reload();
    } finally {
      setBusy(false);
    }
  };

  const status = h ? PAGE_STATUS[h.loginPage.status] : null;
  return (
    <Card className="border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base"><Wifi className="h-4 w-4 text-primary" /> Hotspot</CardTitle>
        <button type="button" aria-label="Read again" onClick={() => void hotspot.reload()}
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
          <RefreshCw className={`h-4 w-4 ${hotspot.loading ? "animate-spin" : ""}`} />
        </button>
      </CardHeader>
      <CardContent>
        {hotspot.loading && !h && <p className="text-sm text-muted-foreground">Reading from the router…</p>}
        {hotspot.error && <p role="alert" className="text-sm text-destructive">{hotspot.error}</p>}
        {h && status && (
          <div>
            <Row label="Login page">
              <span className={status.tone}>{status.text}</span>
            </Row>
            {canEdit && (h.loginPage.status === "OUTDATED" || h.loginPage.status === "MISSING") && (
              <div className="py-2">
                <p className="mb-2 text-xs text-muted-foreground">
                  Customers see RouterOS&apos;s own page or an old copy of ours. Sync to install the current one.
                </p>
                <Button size="sm" disabled={busy} onClick={() => void syncPage()}>Sync login page</Button>
              </div>
            )}
            {h.servers.map((s) => (
              <Row key={s.name ?? s.interface ?? "server"} label={`Server ${s.name ?? ""}`}>
                {s.interface ?? "—"}{s.disabled ? " · off" : ""}
              </Row>
            ))}
            {(["idleTimeout", "keepaliveTimeout"] as const).map((field) => {
              const options = field === "idleTimeout" ? h.idleTimeoutOptions : h.keepaliveTimeoutOptions;
              const current = h[field] ?? "";
              return (
                <Row key={field} label={field === "idleTimeout" ? "Idle timeout" : "Keepalive timeout"}>
                  {canEdit ? (
                    <select
                      aria-label={field === "idleTimeout" ? "Idle timeout" : "Keepalive timeout"}
                      className="rounded-md border border-border bg-background px-2 py-1 text-sm"
                      value={options.includes(current) ? current : ""}
                      disabled={busy}
                      onChange={(e) => void setTimeoutValue(field, e.target.value)}
                    >
                      {!options.includes(current) && <option value="">{current || "—"}</option>}
                      {options.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (current || "—")}
                </Row>
              );
            })}
            <Row label="Accounting">per package, from RADIUS</Row>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** Zero-touch provisioning steps of the router's device row. */
export function ProvisioningPanel({ deviceId }: { deviceId: number }) {
  const load = useCallback(() => getProvisioningChecklist(deviceId), [deviceId]);
  const status = useOnDemand(load, true);
  const s = status.data;
  const steps: [string, boolean][] = s
    ? [
        ["Script generated", s.status != null && s.status !== "NONE"],
        ["Script fetched by the router", s.deliveredAt != null || s.status === "DELIVERED" || s.status === "COMPLETED"],
        ["Script ran to the end", s.status === "COMPLETED"],
        ["Router online over the tunnel", s.online === true],
        ["Dashboard can log in (API)", s.apiAuthenticated === true],
      ]
    : [];
  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-4 w-4 text-primary" /> Provisioning</CardTitle>
      </CardHeader>
      <CardContent>
        {status.error && <p className="text-sm text-muted-foreground">{status.error}</p>}
        {s && s.status === "NONE" && (
          <p className="mb-2 text-xs text-muted-foreground">This router was linked without the zero-touch script.</p>
        )}
        <ul className="space-y-2">
          {steps.map(([label, done]) => (
            <li key={label} className="flex items-center gap-2 text-sm">
              {done ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
              <span className={done ? "" : "text-muted-foreground"}>{label}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
