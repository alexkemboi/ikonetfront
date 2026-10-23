"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldAlert, Wifi } from "lucide-react";
import { getLanHealth } from "@/actions/lanHealth";
import type { RouterLanHealth } from "@/lib/types/lanHealth";
import {
  lanProblemSentence, routersThatCannotSignIn, routersWithCustomersOnWrongAddress, routersWithDhcpServersOnly,
  clockCorrectedSentence, clockLabel, signInLabel, signInProblemSentence, timeAgo,
} from "@/lib/utils/lanHealth";
import { KeyRound, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { HelpTip, HowToReadPanel } from "@/components/network/HealthHelp";
import { passwordLabel, routersWithOldPassword } from "@/lib/utils/lanHealth";
import { reprovisionRoutersWithOldPassword } from "@/actions/lanHealth";
import { withStepUp } from "@/lib/stepUp";
import type { RadiusRolloutResult } from "@/lib/types/lanHealth";
import { visibleInterval } from "@/lib/hooks/useVisibleInterval";

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
export function CustomerNetworkHealth({
  initial,
  canReprovisionAll = false,
}: {
  initial: RouterLanHealth[] | null;
  /** System administrators: show "Reprovision every out-of-date router". */
  canReprovisionAll?: boolean;
}) {
  const [routers, setRouters] = useState<RouterLanHealth[] | null>(initial);
  const [error, setError] = useState("");
  const [rolling, setRolling] = useState(false);
  const [rollout, setRollout] = useState<RadiusRolloutResult[] | null>(null);

  async function reprovisionAll() {
    setRolling(true);
    try {
      const res = await withStepUp(reprovisionRoutersWithOldPassword,
        "Reprovisioning routers changes their RADIUS settings. Re-authenticate to continue.");
      if (res.success) {
        setRollout(res.data ?? []);
        toast.success(res.message);
        const fresh = await getLanHealth();
        if (fresh.data) setRouters(fresh.data);
      } else {
        toast.error(res.message);
      }
    } finally {
      setRolling(false);
    }
  }

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
    const stopPolling = visibleInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      stopPolling();
    };
  }, [initial]);

  const alarms = routersWithCustomersOnWrongAddress(routers ?? []);
  const warnings = routersWithDhcpServersOnly(routers ?? []);
  const cannotSignIn = routersThatCannotSignIn(routers ?? []);
  const oldPassword = routersWithOldPassword(routers ?? []);
  const unrecorded = (routers ?? []).filter((r) => r.radiusPasswordStatus === "UNKNOWN");

  return (
    <section aria-labelledby="customer-network-health" className="rounded-2xl border border-border bg-card shadow-xl">
      <div className="border-b border-border p-6">
        <h2 id="customer-network-health" className="flex items-center gap-2 text-lg font-normal">
          <Wifi className="h-4 w-4 text-primary" /> Customer network health
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          What each router sees between itself and its customers, and whether it can sign them in, checked every
          2 minutes. On a healthy site sign-in is working and the wrong-address and DHCP columns are zero. Access
          points and other equipment are not counted as customers. Press any <HelpTip term="customerSignIn" /> for
          what a heading means and what to do.
        </p>
        <div className="mt-4"><HowToReadPanel /></div>
      </div>

      {canReprovisionAll && (oldPassword.length > 0 || unrecorded.length > 0 || rollout) && (
        <div className="border-b border-border p-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-2xl text-muted-foreground">
              {oldPassword.length > 0
                ? `${oldPassword.length} out of date`
                : "None out of date"}
              {unrecorded.length > 0 ? `, ${unrecorded.length} not recorded (set up before this was tracked)` : ""}.
              {" "}Reprovisioning gives each the current RADIUS password and records it. Run it after every password
              rotation. <HelpTip term="radiusPassword" />
            </p>
            <button
              type="button"
              disabled={rolling || (oldPassword.length === 0 && unrecorded.length === 0)}
              onClick={() => void reprovisionAll()}
              className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-accent disabled:opacity-50"
            >
              <RefreshCcw className={cn("h-4 w-4", rolling && "animate-spin")} />
              {rolling ? "Reprovisioning…" : "Reprovision every out-of-date router"}
            </button>
          </div>
          {rollout && (
            <ul className="mt-3 space-y-1">
              {rollout.length === 0 && <li className="text-muted-foreground">Nothing to do: every router holds the current password.</li>}
              {rollout.map((r) => (
                <li key={r.routerId} className={r.done ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}>
                  {r.routerName}: {r.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {cannotSignIn.length > 0 && (
        <div role="alert" className="border-b border-red-500/30 bg-red-500/5 p-4 text-sm">
          <p className="flex items-center gap-2 font-medium text-red-700 dark:text-red-400">
            <KeyRound className="h-4 w-4" />
            {cannotSignIn.length === 1 ? "A router cannot sign customers in" : `${cannotSignIn.length} routers cannot sign customers in`}
          </p>
          <ul className="mt-2 space-y-1">
            {cannotSignIn.map((r) => (
              <li key={r.routerId}>
                <Link href={`/network/routers/${r.routerId}`} className="font-medium underline-offset-2 hover:underline">{r.routerName}</Link>
                {": "}{signInProblemSentence(r)}
                {r.signInNote ? ` The router reports: ${r.signInNote}.` : ""}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-muted-foreground">
            The router looks online, but the sign-in server is not answering it. The usual cause is a sign-in password
            on the router that no longer matches the server: open the router and run Reprovision Router.
          </p>
        </div>
      )}

      {alarms.length > 0 && (
        <div role="alert" className="border-b border-red-500/30 bg-red-500/5 p-4 text-sm">
          <p className="flex items-center gap-2 font-medium text-red-700 dark:text-red-400">
            <ShieldAlert className="h-4 w-4" />
            {alarms.length === 1 ? "Customers at a site hold wrong addresses" : `Customers at ${alarms.length} sites hold wrong addresses`}
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
            Those customers cannot reach the payment page or the internet. Open the router to see which devices are
            handing out addresses: each must have its DHCP server switched off, or be set to access point mode.
          </p>
        </div>
      )}

      {warnings.length > 0 && (
        <div role="status" className="border-b border-amber-500/30 bg-amber-500/5 p-4 text-sm">
          <p className="flex items-center gap-2 font-medium text-amber-700 dark:text-amber-400">
            <ShieldAlert className="h-4 w-4" />
            Equipment set up to hand out addresses (no customer affected right now)
          </p>
          <ul className="mt-2 space-y-1">
            {warnings.map((r) => (
              <li key={r.routerId}>
                <Link href={`/network/routers/${r.routerId}`} className="font-medium underline-offset-2 hover:underline">{r.routerName}</Link>
                {": "}{lanProblemSentence(r)}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-muted-foreground">
            Not urgent, but a risk: if customers start taking those addresses they lose their connection. Fix the
            listed devices when convenient: DHCP server off, or access point mode.
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
          <table className="w-full min-w-[1200px] text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className={TH}>Router</th>
                <th className={TH}>Customer sign-in <HelpTip term="customerSignIn" /></th>
                <th className={TH}>RADIUS password <HelpTip term="radiusPassword" /></th>
                <th className={TH}>Router clock <HelpTip term="routerClock" /></th>
                <th className={TH}>Customer devices <HelpTip term="customerDevices" /></th>
                <th className={TH}>Customers on a wrong address <HelpTip term="wrongAddress" /></th>
                <th className={TH}>Unauthorised DHCP servers <HelpTip term="rogueDhcp" /></th>
                <th className={TH}>Access points <HelpTip term="accessPoints" /></th>
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
                      {" "}<HelpTip term={r.status === "OK" ? "statusHealthy" : r.status === "ATTENTION" ? "statusAttention" : "statusUnknown"} />
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      title={`Last ${r.signInWindowMinutes} minutes: ${r.signInAnswered} answered, ${r.signInUnanswered} unanswered`}
                      className={cn(
                        r.signInStatus === "NOT_WORKING" || r.signInStatus === "NOT_SET_UP"
                          ? "font-semibold text-red-600 dark:text-red-400"
                          : r.signInStatus === "WORKING" ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                      )}
                    >
                      {signInLabel(r)}
                    </span>
                    {" "}<HelpTip term={
                      r.signInStatus === "WORKING" ? "signInWorking"
                        : r.signInStatus === "NOT_WORKING" ? "signInNotWorking"
                        : r.signInStatus === "NO_ATTEMPTS" ? "signInNoAttempts"
                        : r.signInStatus === "NOT_SET_UP" ? "signInNotSetUp" : "signInUnknown"} />
                  </td>
                  <td className="px-4 py-3">
                    <span
                      title={r.radiusPasswordSetAt ? `Given ${timeAgo(r.radiusPasswordSetAt)} by ${r.radiusPasswordSetBy ?? "?"}` : undefined}
                      className={cn(
                        r.radiusPasswordStatus === "OUT_OF_DATE" ? "font-semibold text-red-600 dark:text-red-400"
                          : r.radiusPasswordStatus === "CURRENT" ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                      )}
                    >
                      {passwordLabel(r)}
                    </span>
                    {" "}<HelpTip term={r.radiusPasswordStatus === "CURRENT" ? "passwordCurrent"
                      : r.radiusPasswordStatus === "OUT_OF_DATE" ? "passwordOutOfDate" : "passwordUnknown"} />
                  </td>
                  <td className="px-4 py-3">
                    <span
                      title={[r.ntpStatus ? `Time server: ${r.ntpStatus}` : null, clockCorrectedSentence(r)].filter(Boolean).join("; ") || undefined}
                      className={cn(
                        r.clockStatus === "WRONG" ? "font-semibold text-red-600 dark:text-red-400"
                          : r.clockStatus === "NO_TIME_SERVER" ? "text-amber-600"
                          : r.clockStatus === "OK" ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                      )}
                    >
                      {clockLabel(r)}
                    </span>
                    {" "}<HelpTip term={r.clockStatus === "OK" ? "clockRight" : r.clockStatus === "WRONG" ? "clockWrong"
                      : r.clockStatus === "NO_TIME_SERVER" ? "clockNoTimeServer" : "clockUnknown"} />
                    {r.clockCorrectedAt && <p className="text-xs text-muted-foreground">{clockCorrectedSentence(r)}</p>}
                  </td>
                  <td className="px-4 py-3"><Figure value={r.devicesOnHotspot} bad={false} /></td>
                  <td className="px-4 py-3"><Figure value={r.devicesOnWrongAddress} bad={(r.devicesOnWrongAddress ?? 0) > 0} /></td>
                  <td className="px-4 py-3">
                    {(r.unauthorisedDhcpServers ?? 0) > 0 && (r.devicesOnWrongAddress ?? 0) === 0
                      ? <span className="tabular-nums font-semibold text-amber-600">{r.unauthorisedDhcpServers}</span>
                      : <Figure value={r.unauthorisedDhcpServers} bad={(r.unauthorisedDhcpServers ?? 0) > 0} />}
                  </td>
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
