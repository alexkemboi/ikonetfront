"use client";

import { useEffect, useState } from "react";
import { ZapOff } from "lucide-react";
import { getRouterOutages } from "@/actions/network";
import type { RouterOutage } from "@/lib/types/network";
import { formatOutageDuration, outageCauseLabel } from "@/lib/utils/outages";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const REFRESH_MS = 60_000;
const DAYS = 30;

const when = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });

/**
 * Confirmed outages of one router. Stricter than "Recent incidents" above it, which
 * lists every missed health check: an outage needs about 2 minutes without an answer.
 */
export function RouterOutages({ routerId }: { routerId: number }) {
  const [outages, setOutages] = useState<RouterOutage[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const res = await getRouterOutages({ routerId, days: DAYS });
      if (cancelled) return;
      setError(res.error ?? "");
      if (res.data) setOutages(res.data);
    };
    void load();
    const timer = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [routerId]);

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ZapOff className="h-4 w-4 text-primary" /> Outages · last {DAYS} days
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          An outage is recorded when the router does not answer for about 2 minutes, and ends when it has
          answered for about 1 minute. The cause is read from the router once it is back.
        </p>
      </CardHeader>
      <CardContent>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {!error && outages == null && <p className="text-sm text-muted-foreground">Loading outages…</p>}
        {outages != null && outages.length === 0 && (
          <p className="text-sm text-muted-foreground">No outages recorded in this period.</p>
        )}
        {outages != null && outages.length > 0 && (
          <ul className="divide-y divide-border">
            {outages.map((outage) => (
              <li key={outage.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2 text-sm">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    outage.status === "OPEN" ? "bg-red-500/10 text-red-600" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {outage.status === "OPEN" ? "Down now" : "Ended"}
                </span>
                <span className="tabular-nums">
                  {when(outage.startedAt)} — {outage.resolvedAt ? when(outage.resolvedAt) : "ongoing"}
                </span>
                <span className="tabular-nums text-muted-foreground">
                  {formatOutageDuration(outage.durationSeconds)}
                </span>
                <span className="text-muted-foreground">{outageCauseLabel(outage)}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
