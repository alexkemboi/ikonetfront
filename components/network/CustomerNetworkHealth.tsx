"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldAlert, Wifi } from "lucide-react";
import { getLanHealth } from "@/actions/lanHealth";
import type { RouterLanHealth } from "@/lib/types/lanHealth";
import { lanProblemSentence, routersWithDhcpAlarm, timeAgo } from "@/lib/utils/lanHealth";
import { cn } from "@/lib/utils";

const REFRESH_MS = 60_000;
const TH = "px-4 py-3 text-[11px] uppercase tracking-wider text-muted-foreground";

function Figure({ value, bad }: { value: number | null; bad: boolean }) {
  if (value == null) return <span className="text-muted-foreground">—</span>;
  return <span className={cn("tabular-nums", bad ? "font-semibold text-red-600 dark:text-red-400" : "text-foreground")}>{value}</span>;
}

/**
 * What each router sees on its customer network: devices on a wrong address, devices
 * handing out addresses they should not, and access points. Read from the router every
 * couple of minutes; a router with no hotspot has nothing to check and is not listed.
 */
export function CustomerNetworkHealth({ initial }: { initial: RouterLanHealth[] | null }) {
  const [routers, setRouters] = useState<RouterLanHealth[] | null>(initial);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const res = await getLanHealth();
      if (cancelled) return;
      setError(res.error ?? "");
      // keep the last known figures when a refresh fails
      if (res.data) setRouters(res.data);
    };
    if (initial == null) void load();
    const timer = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [initial]);

  const alarms = routersWithDhcpAlarm(routers ?? []);

  return (
    <section aria-labelledby="customer-network-health" className="rounded-2xl border border-border bg-card shadow-xl">
      <div className="border-b border-border p-6">
        <h2 id="customer-network-health" className="flex items-center gap-2 text-lg font-normal">
          <Wifi className="h-4 w-4 text-primary" /> Customer network health
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          What each router sees between itself and its customers, checked every 2 minutes. On a healthy site the
          two middle columns are zero.
        </p>
      </div>

      {alarms.length > 0 && (
        <div role="alert" className="border-b border-red-500/30 bg-red-500/5 p-4 text-sm">
          <p className="flex items-center gap-2 font-medium text-red-700 dark:text-red-400">
            <ShieldAlert className="h-4 w-4" />
            {alarms.length === 1 ? "A site is handing customers wrong addresses" : `${alarms.length} sites are handing customers wrong addresses`}
          </p>
          <ul className="mt-2 space-y-1">
            {alarms.map((r) => (
              <li key={r.routerId}>
                <Link href={`/network/routers/${r.routerId}`} className="font-medium underline-offset-2 hover:underline">{r.routerName}</Link>
                {": "}{lanProblemSentence(r)}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-muted-foreground">
            Customers who get one of those addresses cannot reach the payment page or the internet. Open the router
            to see which devices to fix: each must have its DHCP server switched off, or be set to access point mode.
          </p>
        </div>
      )}

      {error && <p role="alert" className="border-b border-border px-6 py-2 text-xs text-destructive">{error}</p>}

      {routers == null ? (
        <p className="p-6 text-sm text-muted-foreground">{error ? "The checks could not be loaded." : "Loading checks…"}</p>
      ) : routers.length === 0 ? (
        <p className="p-6 text-sm text-muted-foreground">
          No router has been checked yet. The first check runs within a few minutes of the system starting, and only
          routers with a hotspot are checked.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className={TH}>Router</th>
                <th className={TH} title="Devices the router currently sees on the hotspot, signed in or not.">Devices on hotspot</th>
                <th className={TH} title="Devices holding an address the router did not give out. They cannot reach the payment page or the internet properly.">Devices on a wrong address</th>
                <th className={TH} title="Devices answering customers' address requests besides the router. Usually an access point left in router mode.">Unauthorised DHCP servers</th>
                <th className={TH} title="Access points the router has heard from recently, and those it has not.">Access points</th>
                <th className={TH}>Last checked</th>
              </tr>
            </thead>
            <tbody>
              {routers.map((r) => (
                <tr key={r.routerId} className="border-b border-border last:border-0 hover:bg-accent/50">
                  <td className="px-4 py-3">
                    <Link href={`/network/routers/${r.routerId}`} className="font-medium text-foreground underline-offset-2 hover:underline">
                      {r.routerName}
                    </Link>
                    <p className={cn("text-xs", r.status === "ATTENTION" ? "text-red-600 dark:text-red-400" : "text-muted-foreground")}>
                      {r.status === "OK" ? "Healthy" : r.status === "ATTENTION" ? "Needs attention" : "Could not be read"}
                    </p>
                  </td>
                  <td className="px-4 py-3"><Figure value={r.devicesOnHotspot} bad={false} /></td>
                  <td className="px-4 py-3"><Figure value={r.devicesOnWrongAddress} bad={(r.devicesOnWrongAddress ?? 0) > 0} /></td>
                  <td className="px-4 py-3"><Figure value={r.unauthorisedDhcpServers} bad={(r.unauthorisedDhcpServers ?? 0) > 0} /></td>
                  <td className="px-4 py-3">
                    <span className="tabular-nums">{r.accessPointsSeen} seen</span>
                    {r.accessPointsNotSeen > 0 && (
                      <span className="tabular-nums font-semibold text-amber-600"> · {r.accessPointsNotSeen} not seen</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {timeAgo(r.checkedAt)}
                    {r.error && <p className="text-xs text-amber-600" title={r.error}>last try failed</p>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
