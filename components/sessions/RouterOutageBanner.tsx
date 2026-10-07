"use client";

import { useEffect, useState } from "react";
import { ZapOff } from "lucide-react";
import { getRouterOutages } from "@/actions/network";
import type { RouterOutage } from "@/lib/types/network";
import { formatOutageDuration } from "@/lib/utils/outages";

interface RouterOutageBannerProps {
  initialOutages: RouterOutage[];
  refreshIntervalSeconds: number;
}

/**
 * Shown above Live Sessions while a router is confirmed down, so "Lost contact" rows are
 * read as a site outage and not as a fault with each customer.
 */
export function RouterOutageBanner({ initialOutages, refreshIntervalSeconds }: RouterOutageBannerProps) {
  const [outages, setOutages] = useState<RouterOutage[]>(initialOutages);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const res = await getRouterOutages({ openOnly: true });
      if (cancelled) return;
      // keep the last known list when a refresh fails: an outage must not vanish on an error
      if (res.data) setOutages(res.data);
      setNow(Date.now());
    };
    const timer = setInterval(load, refreshIntervalSeconds * 1000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [refreshIntervalSeconds]);

  if (outages.length === 0) return null;

  return (
    <div role="alert" className="rounded-lg border border-red-500/40 bg-red-500/5 p-4 text-sm">
      <p className="flex items-center gap-2 font-medium text-red-700 dark:text-red-400">
        <ZapOff className="h-4 w-4" />
        {outages.length === 1 ? "1 router is down" : `${outages.length} routers are down`}
      </p>
      <ul className="mt-2 space-y-1">
        {outages.map((outage) => {
          const started = new Date(outage.startedAt);
          const seconds = now == null
            ? outage.durationSeconds
            : Math.max(outage.durationSeconds, Math.round((now - started.getTime()) / 1000));
          return (
            <li key={outage.id} className="tabular-nums">
              <span className="font-medium">{outage.routerName ?? `Router ${outage.routerId}`}</span>
              {" has not answered since "}
              {started.toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              {` (${formatOutageDuration(seconds)}).`}
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-muted-foreground">
        Customers on {outages.length === 1 ? "this router" : "these routers"} are offline and show as
        &quot;Lost contact&quot; below. Nothing is wrong with their own devices.
      </p>
    </div>
  );
}
