"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { getLanHealth } from "@/actions/lanHealth";
import type { RouterLanHealth } from "@/lib/types/lanHealth";
import { lanProblemSentence, routersThatCannotSignIn, routersWithCustomersOnWrongAddress, signInProblemSentence } from "@/lib/utils/lanHealth";

/**
 * Shown above Live Sessions while a site's own equipment is giving customers wrong
 * addresses, so "Not online" customers there are read as a site fault, not as people leaving.
 */
export function CustomerNetworkAlarm({
  initial,
  refreshIntervalSeconds,
}: {
  initial: RouterLanHealth[];
  refreshIntervalSeconds: number;
}) {
  const [routers, setRouters] = useState<RouterLanHealth[]>(initial);

  useEffect(() => {
    let cancelled = false;
    const timer = setInterval(async () => {
      const res = await getLanHealth();
      // keep the last known state when a refresh fails: an alarm must not vanish on an error
      if (!cancelled && res.data) setRouters(res.data);
    }, Math.max(60, refreshIntervalSeconds) * 1000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [refreshIntervalSeconds]);

  // only what affects customers now; equipment that merely could is shown on Router Monitoring
  const alarms = routersWithCustomersOnWrongAddress(routers);
  const cannotSignIn = routersThatCannotSignIn(routers);
  if (alarms.length === 0 && cannotSignIn.length === 0) return null;

  if (alarms.length === 0) {
    return <SignInAlarm routers={cannotSignIn} />;
  }

  return (
    <>
    {cannotSignIn.length > 0 && <SignInAlarm routers={cannotSignIn} />}
    <div role="alert" className="rounded-lg border border-red-500/40 bg-red-500/5 p-4 text-sm">
      <p className="flex items-center gap-2 font-medium text-red-700 dark:text-red-400">
        <ShieldAlert className="h-4 w-4" />
        Customers hold wrong addresses
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
        Customers there who show as &quot;Not online&quot; may be unable to connect at all. This is a fault in the
        site&apos;s access points, not in their phones or their payment.
      </p>
    </div>
    </>
  );
}

function SignInAlarm({ routers }: { routers: RouterLanHealth[] }) {
  return (
    <div role="alert" className="rounded-lg border border-red-500/40 bg-red-500/5 p-4 text-sm">
      <p className="flex items-center gap-2 font-medium text-red-700 dark:text-red-400">
        <ShieldAlert className="h-4 w-4" />
        {routers.length === 1 ? "A router cannot sign customers in" : `${routers.length} routers cannot sign customers in`}
      </p>
      <ul className="mt-2 space-y-1">
        {routers.map((r) => (
          <li key={r.routerId}>
            <Link href={`/network/routers/${r.routerId}`} className="font-medium underline-offset-2 hover:underline">{r.routerName}</Link>
            {": "}{signInProblemSentence(r)}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-muted-foreground">
        Customers there who paid show as &quot;has not connected yet&quot;. Their payment is recorded; they connect by
        themselves once sign-in works again, or can be given a voucher.
      </p>
    </div>
  );
}
