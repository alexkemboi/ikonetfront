"use client";

import { useEffect, useState } from "react";
import { Line, LineChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Check, Pencil, Radio, ShieldAlert, X } from "lucide-react";
import { toast } from "sonner";
import { getRouterLanDetail, updateAccessPoint } from "@/actions/lanHealth";
import type { LanAccessPoint, RouterLanDetail } from "@/lib/types/lanHealth";
import {
  clockCorrectedSentence, clockLabel, passwordLabel, signInLabel, signInProblemSentence, timeAgo,
} from "@/lib/utils/lanHealth";
import { HelpTip, HowToReadPanel } from "@/components/network/HealthHelp";
import type { HelpKey } from "@/lib/help/networkHealthHelp";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { visibleInterval } from "@/lib/hooks/useVisibleInterval";

const REFRESH_MS = 60_000;
const TH = "px-3 py-2 text-[11px] uppercase tracking-wider text-muted-foreground";

const STATUS: Record<LanAccessPoint["status"], { label: string; className: string }> = {
  SEEN: { label: "Seen", className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  NOT_SEEN: { label: "Not seen", className: "bg-amber-500/10 text-amber-700" },
  IGNORED: { label: "Not watched", className: "bg-muted text-muted-foreground" },
};

type Tone = "red" | "amber" | "green" | "plain";

const TONE: Record<Tone, string> = {
  red: "text-red-600 dark:text-red-400",
  amber: "text-amber-600",
  green: "text-emerald-600 dark:text-emerald-400",
  plain: "text-foreground",
};

function Tile({ label, value, hint, bad, tone, help }: {
  label: string; value: string; hint: string; bad?: boolean; tone?: Tone; help?: HelpKey;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label} {help && <HelpTip term={help} />}</p>
      <p className={cn("mt-1 text-2xl font-semibold tabular-nums", TONE[tone ?? (bad ? "red" : "plain")])}>{value}</p>
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
    const stopPolling = visibleInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      stopPolling();
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

      {!stale && signInProblemSentence(health) && (
        <div role="alert" className="rounded-lg border border-red-500/40 bg-red-500/5 p-4 text-sm">
          <p className="flex items-center gap-2 font-medium text-red-700 dark:text-red-400">
            <ShieldAlert className="h-4 w-4" /> This router cannot sign customers in
          </p>
          <p className="mt-1 text-muted-foreground">
            {(() => { const s = signInProblemSentence(health) ?? ""; return s.charAt(0).toUpperCase() + s.slice(1); })()}
            {health.signInNote ? ` The router reports: ${health.signInNote}.` : ""} The usual cause is a sign-in
            password on the router that no longer matches the server. Run Reprovision Router from the actions menu
            above; if it stays like this, the server is not reachable from the router.
          </p>
        </div>
      )}

      {!stale && servers.length > 0 && (
        <div role={(health.devicesOnWrongAddress ?? 0) > 0 ? "alert" : "status"} className={cn("rounded-lg border p-4 text-sm",
          (health.devicesOnWrongAddress ?? 0) > 0 ? "border-red-500/40 bg-red-500/5" : "border-amber-500/40 bg-amber-500/5")}>
          <p className={cn("flex items-center gap-2 font-medium",
            (health.devicesOnWrongAddress ?? 0) > 0 ? "text-red-700 dark:text-red-400" : "text-amber-700 dark:text-amber-400")}>
            <ShieldAlert className="h-4 w-4" />
            {servers.length} {servers.length === 1 ? "device is" : "devices are"} handing out addresses on this network
            {(health.devicesOnWrongAddress ?? 0) === 0 ? " (no customer affected right now)" : ""}
          </p>
          <p className="mt-1 text-muted-foreground">
            Only the router may do that. A customer who gets an address from one of these devices cannot reach the
            payment page or the internet. On each device marked below, switch its DHCP server off or set it to access
            point mode. The mark clears about 20 minutes after the device stops.
          </p>
        </div>
      )}

      <HowToReadPanel />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-7">
        <Tile label="Customer sign-in" value={signInLabel(health)} help="customerSignIn"
          tone={health.signInStatus === "NOT_WORKING" || health.signInStatus === "NOT_SET_UP" ? "red"
            : health.signInStatus === "WORKING" ? "green" : "plain"}
          hint={health.signInStatus === "NOT_SET_UP"
            ? "no sign-in server is set on the router"
            : `last ${health.signInWindowMinutes} min: ${health.signInAnswered} answered, ${health.signInUnanswered} unanswered`}
          />
        <Tile label="RADIUS password" value={passwordLabel(health)} help="radiusPassword"
          tone={health.radiusPasswordStatus === "OUT_OF_DATE" ? "red" : health.radiusPasswordStatus === "CURRENT" ? "green" : "plain"}
          hint={health.radiusPasswordStatus === "OUT_OF_DATE"
            ? "every sign-in from this router is refused: run Reprovision Router"
            : health.radiusPasswordSetAt
              ? `given ${timeAgo(health.radiusPasswordSetAt)} (${(health.radiusPasswordSetBy ?? "").toLowerCase().replace("_", " ")})`
              : "not recorded: run Reprovision Router once to record it"} />
        <Tile label="Router clock" value={clockLabel(health)} help="routerClock"
          tone={health.clockStatus === "WRONG" ? "red" : health.clockStatus === "NO_TIME_SERVER" ? "amber"
            : health.clockStatus === "OK" ? "green" : "plain"}
          hint={health.clockStatus === "WRONG"
            ? "purchases here show as \"Paid, not connected\": run Sync Router Time"
            : [health.clockStatus === "NO_TIME_SERVER" ? `time server ${health.ntpStatus?.toLowerCase() ?? "not answering"}` : null,
               clockCorrectedSentence(health)].filter(Boolean).join("; ") || "session times from this router can be trusted"} />
        <Tile label="Customer devices" help="customerDevices" value={String(health.devicesOnHotspot ?? "—")} hint="on the hotspot now, signed in or not; access points not counted" />
        <Tile label="Customers on a wrong address" help="wrongAddress" value={String(health.devicesOnWrongAddress ?? "—")}
          hint="hold an address this router did not give out; should be 0" bad={(health.devicesOnWrongAddress ?? 0) > 0} />
        <Tile label="Unauthorised DHCP servers" help="rogueDhcp" value={String(health.unauthorisedDhcpServers ?? "—")}
          hint={(health.unauthorisedDhcpServers ?? 0) > 0 && (health.devicesOnWrongAddress ?? 0) === 0
            ? "devices set up to hand out addresses; no customer affected right now"
            : "devices giving out addresses besides the router; must be 0"}
          tone={(health.unauthorisedDhcpServers ?? 0) === 0 ? "plain" : (health.devicesOnWrongAddress ?? 0) > 0 ? "red" : "amber"} />
        <Tile label="Access points" help="accessPoints" value={`${health.accessPointsSeen} seen`}
          hint={health.accessPointsNotSeen > 0 ? `${health.accessPointsNotSeen} not seen for over ${health.notSeenAfterMinutes} minutes` : "all watched access points were seen recently"}
          tone={health.accessPointsNotSeen > 0 ? "amber" : "plain"} />
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
                <Line type="monotone" dataKey="devicesOnHotspot" name="Customer devices" stroke="#6b7280" strokeWidth={2} dot={false} />
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
                    <th className={TH}>Status <HelpTip term="apNotSeen" /></th>
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
                      <td className="px-3 py-2 font-mono text-xs">
                        {ap.macAddress}
                        {(ap.otherMacAddresses?.length ?? 0) > 0 && (
                          <p className="font-sans text-muted-foreground" title={ap.otherMacAddresses!.join(", ")}>
                            +{ap.otherMacAddresses!.length} more {ap.otherMacAddresses!.length === 1 ? "address" : "addresses"} of the same device
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium", STATUS[ap.status].className)}>{STATUS[ap.status].label}</span>
                        {ap.actingAsDhcpServer && (
                          <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
                            Handing out addresses: switch its DHCP off <HelpTip term="rogueDhcp" />
                          </p>
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
