"use client";

import { useCallback, useEffect, useState } from "react";
import { CircleAlert, Info, RadioTower, RefreshCcw, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { checkUplinkNow, getRouterContact } from "@/actions/uplink";
import type { ContactFinding, RouterContact } from "@/lib/types/uplink";
import { UPLINK_LABEL, UPLINK_TONE, ageText } from "@/lib/utils/uplink";
import { visibleInterval } from "@/lib/hooks/useVisibleInterval";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const REFRESH_MS = 60_000;

const COMMAND_TEXT: Record<string, string> = {
  PENDING: "issued, not fetched yet",
  DELIVERED: "fetched, not finished",
  COMPLETED: "ran to the end",
  EXPIRED: "expired",
  REVOKED: "replaced by a newer one",
};

const FINDING_STYLE: Record<ContactFinding["level"], { box: string; icon: typeof Info }> = {
  RED: { box: "border-red-500/30 bg-red-500/5 text-red-800 dark:text-red-300", icon: CircleAlert },
  AMBER: { box: "border-amber-500/30 bg-amber-500/5 text-amber-900 dark:text-amber-300", icon: TriangleAlert },
  INFO: { box: "border-border bg-muted/40 text-foreground", icon: Info },
};

/** "17 Oct, 15:46 · 2 days ago"; "—" when null. */
export function when(value: string | null | undefined, now: number = Date.now()): string {
  if (!value) return "—";
  const t = Date.parse(value);
  if (Number.isNaN(t)) return value;
  const stamp = new Date(t).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const age = Math.max(0, Math.round((now - t) / 1000));
  return `${stamp} · ${ageText(age)} ago`;
}

function Row({ label, children, tone }: { label: string; children: React.ReactNode; tone?: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 text-sm [&:not(:last-child)]:border-b border-border">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className={cn("min-w-0 text-right font-medium tabular-nums", tone)}>{children}</span>
    </div>
  );
}

const RED = "text-red-600 dark:text-red-400";

/**
 * When the system last heard from this router, by each channel, and what to do about a silence
 * (the field guide's Card F). Read from stored checks and the server: nothing is read from the router,
 * so it works when the router is silent.
 */
export function RouterContactPanel({ routerId, canCheck = false }: { routerId: number; canCheck?: boolean }) {
  const [contact, setContact] = useState<RouterContact | null>(null);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const load = useCallback(async () => {
    const res = await getRouterContact(routerId);
    setError(res.error ?? "");
    // keep the last known contact when a refresh fails
    if (res.data) setContact(res.data);
  }, [routerId]);

  useEffect(() => {
    void load();
    return visibleInterval(load, REFRESH_MS);
  }, [load]);

  async function checkNow() {
    setChecking(true);
    try {
      const res = await checkUplinkNow(routerId);
      if (res.data) {
        toast.success(`${res.data.routerName}: ${UPLINK_LABEL[res.data.status]}`);
        await load();
      } else {
        toast.error(res.error ?? "The check could not be run.");
      }
    } finally {
      setChecking(false);
    }
  }

  const c = contact;
  const status = c?.latest?.status ?? null;
  const tunnelSilent = c?.latest?.handshakeAgeS == null || c.latest.handshakeAgeS > 300;
  const command = c?.lastCommand;

  return (
    <Card className="border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2 text-base"><RadioTower className="h-4 w-4 text-primary" /> Contact</CardTitle>
        <div className="flex items-center gap-2">
          {status && <span className={cn("text-sm", UPLINK_TONE[status])}>{UPLINK_LABEL[status]}</span>}
          {canCheck && (
            <button type="button" onClick={() => void checkNow()} disabled={checking} aria-label="Check now"
              title="Check now"
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50">
              <RefreshCcw className={cn("h-4 w-4", checking && "animate-spin")} />
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && !c && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {!c && !error && <p className="text-sm text-muted-foreground">Loading…</p>}
        {c && (
          <>
            {c.findings.length > 0 ? (
              <ul className="space-y-2">
                {c.findings.map((f) => {
                  const style = FINDING_STYLE[f.level];
                  const Icon = style.icon;
                  return (
                    <li key={f.text} role={f.level === "INFO" ? undefined : "alert"}
                      className={cn("flex gap-2 rounded-md border px-3 py-2 text-xs leading-relaxed", style.box)}>
                      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>{f.text}</span>
                    </li>
                  );
                })}
              </ul>
            ) : c.latest ? (
              <p className="text-xs text-muted-foreground">Every channel is current. Nothing to do.</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Not checked yet. Routers are checked every minute; the first check runs about a minute after the system starts.
              </p>
            )}

            <div>
              {c.contactLostAt && <Row label="Contact lost" tone={RED}>{when(c.contactLostAt)}</Row>}
              <Row label="Tunnel last heard" tone={c.latest && tunnelSilent ? RED : undefined}>
                {c.lastTunnelAt ? when(c.lastTunnelAt) : "not in 14 days"}
              </Row>
              <Row label="Customer sign-ins">
                {c.lastSignInReportAt ? when(c.lastSignInReportAt) : "none in 14 days"}
                {c.latest?.radiusOnline != null && (
                  <span className="block text-xs font-normal text-muted-foreground">{c.latest.radiusOnline} online now</span>
                )}
              </Row>
              <Row label="System login">
                {c.lastLoginAt ? `worked ${when(c.lastLoginAt)}` : "not in 14 days"}
              </Row>
              <Row label="Public address">
                {c.publicIp ?? "—"}
                {c.provider && <span className="font-normal text-muted-foreground"> · {c.provider}</span>}
                {c.publicIpSince && (
                  <span className="block text-xs font-normal text-muted-foreground">
                    {c.previousPublicIp == null && c.publicIpSince === c.historyFrom ? "for 14 days or more" : `since ${when(c.publicIpSince)}`}
                  </span>
                )}
              </Row>
              {c.previousPublicIp && (
                <Row label="Before that">
                  {c.previousPublicIp}
                  {c.previousProvider && <span className="font-normal text-muted-foreground"> · {c.previousProvider}</span>}
                  <span className="block text-xs font-normal text-muted-foreground">until {when(c.previousPublicIpUntil)}</span>
                </Row>
              )}
              <Row label="Tunnel on the server" tone={c.serverHasTunnel === false && c.linkedByZtp ? RED : undefined}>
                {c.serverHasTunnel == null ? "not readable" : c.serverHasTunnel ? (c.serverKeyMatches === false ? "yes, other key" : "yes") : "missing"}
              </Row>
              {c.linkedByZtp && (
                <Row label="Record's tunnel key" tone={c.recordHasKey === false ? RED : undefined}>
                  {c.recordHasKey ? "kept" : "missing"}
                </Row>
              )}
              <Row label="Setup command">
                {command ? (
                  <>
                    {COMMAND_TEXT[command.status] ?? command.status}
                    <span className="block text-xs font-normal text-muted-foreground">issued {when(command.issuedAt)}</span>
                  </>
                ) : c.linkedByZtp ? "—" : "linked without one"}
              </Row>
            </div>
            {error && <p className="text-xs text-destructive">{error} Showing the last figures read.</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}
