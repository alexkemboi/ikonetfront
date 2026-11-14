"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Globe, RefreshCcw, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { checkUplinkNow, getUplink, getUplinkHistory } from "@/actions/uplink";
import type { UplinkCheck } from "@/lib/types/uplink";
import { UPLINK_LABEL, UPLINK_TONE, ageText, mbps, pingText, uplinkProblems, windowText } from "@/lib/utils/uplink";
import { timeAgo } from "@/lib/utils/lanHealth";
import { visibleInterval } from "@/lib/hooks/useVisibleInterval";

const REFRESH_MS = 60_000;
const TH = "px-4 py-3 text-[11px] uppercase tracking-wider text-muted-foreground";

/**
 * Whether each router's internet source (Starlink and others) is working, checked every minute:
 * the management tunnel and RADIUS seen from the server, and from inside the router its route to
 * the internet, pings and WAN traffic. A site without internet cannot take payments, so failed and
 * unconfirmed purchases of the last 24 hours are shown beside each router.
 */
export function RouterUplinkPanel({
  initial,
  canCheck = false,
}: {
  initial: UplinkCheck[] | null;
  /** System administrators, company admins and managers may run a check now. */
  canCheck?: boolean;
}) {
  const [checks, setChecks] = useState<UplinkCheck[] | null>(initial);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState<number | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [history, setHistory] = useState<UplinkCheck[] | null>(null);
  const sortedChecks = useMemo(
    () => [...(checks ?? [])].sort((a, b) =>
      a.routerName.trim().localeCompare(b.routerName.trim(), undefined, { sensitivity: "base", numeric: true })
    ),
    [checks]
  );

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const res = await getUplink();
      if (cancelled) return;
      setError(res.error ?? "");
      // keep the last known checks when a refresh fails
      if (res.data) setChecks(res.data);
    };
    if (initial == null) void load();
    const stopPolling = visibleInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      stopPolling();
    };
  }, [initial]);

  async function checkNow(routerId: number) {
    setChecking(routerId);
    try {
      const res = await checkUplinkNow(routerId);
      if (res.data) {
        const fresh = res.data;
        setChecks((prev) => (prev ?? []).map((c) => (c.routerId === routerId
          ? { ...fresh, failedPurchases24h: c.failedPurchases24h, unconfirmedPurchases24h: c.unconfirmedPurchases24h }
          : c)));
        toast.success(`${fresh.routerName}: ${UPLINK_LABEL[fresh.status]}`);
        if (open === routerId) void showHistory(routerId, true);
      } else {
        toast.error(res.error ?? "The check could not be run.");
      }
    } finally {
      setChecking(null);
    }
  }

  async function showHistory(routerId: number, keepOpen = false) {
    if (open === routerId && !keepOpen) {
      setOpen(null);
      return;
    }
    setOpen(routerId);
    setHistory(null);
    const res = await getUplinkHistory(routerId, 24);
    setHistory(res.data ?? []);
  }

  const problems = uplinkProblems(checks ?? []);
  const blind = (checks ?? []).filter((c) => c.status === "TUNNEL_FAULT");

  return (
    <section aria-labelledby="router-uplink" className="rounded-2xl border border-border bg-card shadow-xl">
      <div className="border-b border-border p-6">
        <h2 id="router-uplink" className="flex items-center gap-2 text-lg font-normal">
          <Globe className="h-4 w-4 text-primary" /> Internet uplink
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Whether each site&apos;s internet source is working, checked every minute. &quot;No contact&quot; means
          neither the management tunnel nor customer sign-ins have been heard from the router: no power, no internet,
          or the router is off. The router pings the internet itself every minute, and the last 15 minutes are judged
          together against the site&apos;s own speed when it is quiet: &quot;Internet slow&quot; means some pings are
          lost or queued (customers feel pages crawl), &quot;Internet poor&quot; means many are lost, delays are long, or
          the connection keeps dropping. A site without internet cannot take payments.
        </p>
      </div>

      {problems.length > 0 && (
        <div role="alert" className="border-b border-red-500/30 bg-red-500/5 p-4 text-sm">
          <p className="flex items-center gap-2 font-medium text-red-700 dark:text-red-400">
            <TriangleAlert className="h-4 w-4" />
            {problems.length === 1 ? "A site has no working internet" : `${problems.length} sites have no working internet`}
          </p>
          <ul className="mt-2 space-y-1">
            {problems.map((c) => (
              <li key={c.routerId}>
                <Link href={`/network/routers/${c.routerId}`} className="font-medium underline-offset-2 hover:underline">{c.routerName}</Link>
                {c.provider ? ` (${c.provider})` : ""}{": "}{c.reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {blind.length > 0 && (
        <div role="status" className="border-b border-amber-500/30 bg-amber-500/5 p-4 text-sm">
          <p className="font-medium text-amber-700 dark:text-amber-400">
            Customers online, but the system cannot reach {blind.length === 1 ? "the router" : `${blind.length} routers`}
          </p>
          <ul className="mt-2 space-y-1">
            {blind.map((c) => <li key={c.routerId}><span className="font-medium">{c.routerName}</span>: {c.reason}</li>)}
          </ul>
          <p className="mt-2 text-muted-foreground">
            Disconnects, speed changes and remote management do not reach these routers until their management tunnel
            (WireGuard) is back. Someone on site must check the router&apos;s WireGuard settings.
          </p>
        </div>
      )}

      {error && <p role="alert" className="border-b border-border px-6 py-2 text-xs text-destructive">{error}</p>}

      {checks == null ? (
        <p className="p-6 text-sm text-muted-foreground">{error ? "The checks could not be loaded." : "Loading checks…"}</p>
      ) : checks.length === 0 ? (
        <p className="p-6 text-sm text-muted-foreground">
          No router has been checked yet. The first check runs about a minute after the system starts.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className={TH}>Router</th>
                <th className={TH}>Internet</th>
                <th className={TH}>Provider</th>
                <th className={TH}>Tunnel last heard</th>
                <th className={TH}>Customers online</th>
                <th className={TH}>Router to internet</th>
                <th className={TH}>WAN now</th>
                <th className={TH}>Purchases failed / unconfirmed (24 h)</th>
                <th className={TH}>Checked</th>
                {canCheck && <th className={TH}><span className="sr-only">Check now</span></th>}
              </tr>
            </thead>
            <tbody>
              {sortedChecks.map((c) => (
                <UplinkRow
                  key={c.routerId}
                  check={c}
                  canCheck={canCheck}
                  checking={checking === c.routerId}
                  onCheck={() => void checkNow(c.routerId)}
                  open={open === c.routerId}
                  onToggle={() => void showHistory(c.routerId)}
                  history={open === c.routerId ? history : null}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function UplinkRow({
  check: c, canCheck, checking, onCheck, open, onToggle, history,
}: {
  check: UplinkCheck;
  canCheck: boolean;
  checking: boolean;
  onCheck: () => void;
  open: boolean;
  onToggle: () => void;
  history: UplinkCheck[] | null;
}) {
  const columns = canCheck ? 10 : 9;
  return (
    <>
      <tr className="border-b border-border last:border-0 hover:bg-accent/50">
        <td className="px-4 py-3">
          <button type="button" onClick={onToggle} aria-expanded={open}
            className="text-left font-medium text-foreground underline-offset-2 hover:underline">
            {c.routerName}
          </button>
          <p className="text-xs text-muted-foreground">{c.tunnelIp ?? "no tunnel address"}</p>
          {c.drift && (
            <p className={cn("mt-1 max-w-[280px] text-xs",
              c.wanList ? "text-red-600 dark:text-red-400" : "text-muted-foreground")}>
              {c.drift}
            </p>
          )}
        </td>
        <td className="px-4 py-3">
          <span className={UPLINK_TONE[c.status]} title={c.reason ?? undefined}>{UPLINK_LABEL[c.status]}</span>
          <p className="max-w-[260px] text-xs text-muted-foreground">{c.reason}</p>
        </td>
        <td className="px-4 py-3">
          {c.provider ?? <span className="text-muted-foreground">—</span>}
          {c.publicIp && <p className="text-xs text-muted-foreground tabular-nums">{c.publicIp}</p>}
        </td>
        <td className={cn("px-4 py-3 tabular-nums", (c.handshakeAgeS ?? Infinity) > 300 && "text-red-600 dark:text-red-400")}>
          {c.handshakeAgeS == null ? "never" : `${ageText(c.handshakeAgeS)} ago`}
        </td>
        <td className="px-4 py-3 tabular-nums">
          {c.radiusOnline ?? 0}
          <p className="text-xs text-muted-foreground">
            {c.radiusAgeS == null ? "no sign-ins in 2 days" : `last report ${ageText(c.radiusAgeS)} ago`}
          </p>
        </td>
        <td className="px-4 py-3">
          <span title={c.probeError ?? undefined}>{pingText(c)}</span>
          {windowText(c) && <p className="text-xs text-muted-foreground tabular-nums">{windowText(c)}</p>}
          {c.defaultRouteOk === false && <p className="text-xs text-red-600 dark:text-red-400">no route to the internet</p>}
          {c.wanRunning === false && <p className="text-xs text-red-600 dark:text-red-400">internet port down</p>}
        </td>
        <td className="px-4 py-3 tabular-nums">
          {c.wanRxBps == null ? "—" : mbps((c.wanRxBps ?? 0) + (c.wanTxBps ?? 0))}
          {c.uplinkInterface && <p className="text-xs text-muted-foreground">{c.uplinkInterface}</p>}
        </td>
        <td className="px-4 py-3 tabular-nums">
          <span className={(c.failedPurchases24h ?? 0) > 0 ? "font-semibold text-red-600 dark:text-red-400" : undefined}>
            {c.failedPurchases24h ?? 0}
          </span>
          {" / "}
          <span className={(c.unconfirmedPurchases24h ?? 0) > 0 ? "font-semibold text-amber-600" : undefined}>
            {c.unconfirmedPurchases24h ?? 0}
          </span>
        </td>
        <td className="px-4 py-3 text-muted-foreground">
          {timeAgo(c.checkedAt)}
          {c.checkKind === "MANUAL" && c.checkedBy && <p className="text-xs">by {c.checkedBy}</p>}
        </td>
        {canCheck && (
          <td className="px-4 py-3">
            <button type="button" onClick={onCheck} disabled={checking}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:bg-accent disabled:opacity-50">
              <RefreshCcw className={cn("h-3.5 w-3.5", checking && "animate-spin")} />
              {checking ? "Checking…" : "Check now"}
            </button>
          </td>
        )}
      </tr>
      {open && (
        <tr className="border-b border-border bg-muted/30">
          <td colSpan={columns} className="px-4 py-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Last 24 hours: changes only</p>
            {history == null ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : (
              <UplinkChanges history={history} />
            )}
          </td>
        </tr>
      )}
    </>
  );
}

/** The checks where the verdict changed, newest first: when the site lost and regained its internet. */
function UplinkChanges({ history }: { history: UplinkCheck[] }) {
  const changes = history.filter((c, i) => i === history.length - 1 || c.status !== history[i + 1].status);
  if (changes.length === 0) return <p className="text-sm text-muted-foreground">No checks in the last 24 hours.</p>;
  return (
    <ul className="space-y-1 text-sm">
      {changes.map((c) => (
        <li key={c.checkedAt} className="flex flex-wrap gap-x-3">
          <span className="w-36 tabular-nums text-muted-foreground">{new Date(c.checkedAt).toLocaleString()}</span>
          <span className={cn("w-32", UPLINK_TONE[c.status])}>{UPLINK_LABEL[c.status]}</span>
          <span className="text-muted-foreground">{c.reason}</span>
        </li>
      ))}
    </ul>
  );
}
