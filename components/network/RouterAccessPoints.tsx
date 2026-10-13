"use client";

import { useEffect, useState } from "react";
import { Line, LineChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Check, Pencil, Radio, ShieldAlert, X } from "lucide-react";
import { toast } from "sonner";
import { getRouterLanDetail, updateAccessPoint } from "@/actions/lanHealth";
import type { LanAccessPoint, RouterLanDetail } from "@/lib/types/lanHealth";
import { timeAgo } from "@/lib/utils/lanHealth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const REFRESH_MS = 60_000;
const TH = "px-3 py-2 text-[11px] uppercase tracking-wider text-muted-foreground";

const STATUS: Record<LanAccessPoint["status"], { label: string; className: string }> = {
  SEEN: { label: "Seen", className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  NOT_SEEN: { label: "Not seen", className: "bg-amber-500/10 text-amber-700" },
  IGNORED: { label: "Not watched", className: "bg-muted text-muted-foreground" },
};

function Tile({ label, value, hint, bad }: { label: string; value: string; hint: string; bad?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-2xl font-semibold tabular-nums", bad ? "text-red-600 dark:text-red-400" : "text-foreground")}>{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

/**
 * One router's customer network: the three figures, their last two days, and the access
 * points behind it. An access point is found by the router itself (its MAC address belongs
 * to an access-point maker, or it was caught handing out addresses); people give it a name.
 */
export function RouterAccessPoints({ routerId, canEdit }: { routerId: number; canEdit: boolean }) {
  const [detail, setDetail] = useState<RouterLanDetail | null>(null);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [showIgnored, setShowIgnored] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const res = await getRouterLanDetail(routerId);
      if (cancelled) return;
      setError(res.error ?? "");
      if (res.data) setDetail(res.data);
    };
    void load();
    const timer = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [routerId, reloadKey]);

  async function save(id: number, change: { label?: string; watched?: boolean }) {
    setBusy(true);
    try {
      const res = await updateAccessPoint(id, change);
      if (res.success) {
        toast.success(res.message);
        setEditing(null);
        setReloadKey((key) => key + 1);
      } else {
        toast.error(res.message);
      }
    } finally {
      setBusy(false);
    }
  }

  if (error && !detail) return <p role="alert" className="text-sm text-destructive">{error}</p>;
  if (!detail) return <p className="text-sm text-muted-foreground">Loading the customer network…</p>;

  const health = detail.health;
  if (!health) {
    return (
      <p className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
        This router&apos;s customer network has not been checked yet. Checks run every 2 minutes on routers that have
        a hotspot; a router without one is not checked.
      </p>
    );
  }

  const servers = detail.accessPoints.filter((ap) => ap.actingAsDhcpServer);
  const listed = detail.accessPoints.filter((ap) => showIgnored || ap.watched);
  const ignoredCount = detail.accessPoints.filter((ap) => !ap.watched).length;
  const stale = health.status === "UNKNOWN";

  return (
    <div className="space-y-6">
      {stale && (
        <p role="status" className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm">
          The router could not be read lately{health.error ? ` (${health.error})` : ""}. The figures below are from{" "}
          {timeAgo(health.checkedAt)} and may no longer be true.
        </p>
      )}

      {!stale && servers.length > 0 && (
        <div role="alert" className="rounded-lg border border-red-500/40 bg-red-500/5 p-4 text-sm">
          <p className="flex items-center gap-2 font-medium text-red-700 dark:text-red-400">
            <ShieldAlert className="h-4 w-4" />
            {servers.length} {servers.length === 1 ? "device is" : "devices are"} handing out addresses on this network
          </p>
          <p className="mt-1 text-muted-foreground">
            Only the router may do that. A customer who gets an address from one of these devices cannot reach the
            payment page or the internet. On each device marked below, switch its DHCP server off or set it to access
            point mode. The mark clears about 20 minutes after the device stops.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Tile label="Devices on hotspot" value={String(health.devicesOnHotspot ?? "—")} hint="seen by the router now, signed in or not" />
        <Tile label="Devices on a wrong address" value={String(health.devicesOnWrongAddress ?? "—")}
          hint="hold an address this router did not give out; should be 0" bad={(health.devicesOnWrongAddress ?? 0) > 0} />
        <Tile label="Unauthorised DHCP servers" value={String(health.unauthorisedDhcpServers ?? "—")}
          hint="devices giving out addresses besides the router; must be 0" bad={(health.unauthorisedDhcpServers ?? 0) > 0} />
        <Tile label="Access points" value={`${health.accessPointsSeen} seen`}
          hint={health.accessPointsNotSeen > 0 ? `${health.accessPointsNotSeen} not seen for over ${health.notSeenAfterMinutes} minutes` : "all watched access points were seen recently"}
          bad={health.accessPointsNotSeen > 0} />
      </div>
      <p className="text-xs text-muted-foreground">Last checked {timeAgo(health.checkedAt)}.</p>

      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Last 48 hours</CardTitle>
          <p className="text-sm text-muted-foreground">The highest value of each hour, so a problem that came and went still shows.</p>
        </CardHeader>
        <CardContent className="h-64">
          {detail.history.length < 2 ? (
            <p className="text-sm text-muted-foreground">Not enough checks yet to draw a line.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={detail.history} margin={{ left: -10, right: 10, top: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(120, 120, 120, 0.15)" />
                <XAxis dataKey="at" minTickGap={40} className="text-xs"
                  tickFormatter={(v: string) => new Date(v).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })} />
                <YAxis allowDecimals={false} className="text-xs" />
                <Tooltip labelFormatter={(v) => new Date(String(v)).toLocaleString()} />
                <Legend />
                <Line type="monotone" dataKey="devicesOnHotspot" name="Devices on hotspot" stroke="#6b7280" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="devicesOnWrongAddress" name="On a wrong address" stroke="#ef4444" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="unauthorisedDhcpServers" name="Unauthorised DHCP servers" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="border shadow-sm">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base"><Radio className="h-4 w-4 text-primary" /> Access points</CardTitle>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Found by the router itself. Give each one a name or place so it can be located. &quot;Not seen&quot; means
              the router has heard nothing from it for over {health.notSeenAfterMinutes} minutes: it may be off,
              unplugged, or just quiet.
            </p>
          </div>
          {ignoredCount > 0 && (
            <button type="button" onClick={() => setShowIgnored((v) => !v)} className="text-xs text-muted-foreground underline-offset-2 hover:underline">
              {showIgnored ? "Hide" : "Show"} {ignoredCount} not watched
            </button>
          )}
        </CardHeader>
        <CardContent>
          {listed.length === 0 ? (
            <p className="text-sm text-muted-foreground">The router has not found any access point behind it yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className={TH}>Name or place</th>
                    <th className={TH}>MAC address</th>
                    <th className={TH}>Status</th>
                    <th className={TH}>Last seen</th>
                    <th className={TH}>Router port</th>
                    {canEdit && <th className={cn(TH, "text-right")}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {listed.map((ap) => (
                    <tr key={ap.id} className="border-b border-border last:border-0">
                      <td className="px-3 py-2">
                        {editing === ap.id ? (
                          <span className="inline-flex items-center gap-1">
                            <input autoFocus value={draft} maxLength={120} onChange={(e) => setDraft(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && !busy && void save(ap.id, { label: draft })}
                              aria-label="Name or place" placeholder="e.g. Block B, 2nd floor"
                              className="h-8 w-56 rounded-md border border-border bg-background px-2 text-sm outline-none focus:border-ring" />
                            <button type="button" disabled={busy} onClick={() => save(ap.id, { label: draft })} aria-label="Save" className="rounded p-1 hover:bg-accent"><Check className="h-4 w-4" /></button>
                            <button type="button" disabled={busy} onClick={() => setEditing(null)} aria-label="Cancel" className="rounded p-1 hover:bg-accent"><X className="h-4 w-4" /></button>
                          </span>
                        ) : (
                          <span className={ap.label ? "text-foreground" : "text-muted-foreground"}>{ap.label ?? "Not named yet"}</span>
                        )}
                        <p className="text-xs text-muted-foreground">{ap.vendor ?? "Unknown maker"}</p>
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">{ap.macAddress}</td>
                      <td className="px-3 py-2">
                        <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium", STATUS[ap.status].className)}>{STATUS[ap.status].label}</span>
                        {ap.actingAsDhcpServer && (
                          <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">Handing out addresses: switch its DHCP off</p>
                        )}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{timeAgo(ap.lastSeenAt)}</td>
                      <td className="px-3 py-2 text-muted-foreground">{ap.onInterface ?? "—"}</td>
                      {canEdit && (
                        <td className="px-3 py-2 text-right">
                          <span className="inline-flex items-center gap-3 text-xs">
                            <button type="button" onClick={() => { setEditing(ap.id); setDraft(ap.label ?? ""); }}
                              className="inline-flex items-center gap-1 font-medium underline-offset-2 hover:underline">
                              <Pencil className="h-3 w-3" /> Name
                            </button>
                            <button type="button" disabled={busy} onClick={() => save(ap.id, { watched: !ap.watched })}
                              title={ap.watched ? "For a device that is not an access point, or one that was removed." : "Watch this device again."}
                              className="text-muted-foreground underline-offset-2 hover:underline">
                              {ap.watched ? "Stop watching" : "Watch again"}
                            </button>
                          </span>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
