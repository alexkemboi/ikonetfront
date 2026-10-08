"use client";

import { useEffect, useState } from "react";
import { ZapOff } from "lucide-react";
import { closeRouterOutage, getRouterOutages, refuseRouterOutageCredit } from "@/actions/network";
import { toast } from "sonner";
import type { RouterOutage } from "@/lib/types/network";
import { formatOutageDuration, outageCauseLabel, outageCreditLabel } from "@/lib/utils/outages";
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
  const [reloadKey, setReloadKey] = useState(0);
  /** "close:<id>" or "refuse:<id>" while the operator is being asked to confirm. */
  const [confirming, setConfirming] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function act(kind: "close" | "refuse", outageId: string) {
    setBusy(true);
    try {
      const res = kind === "close" ? await closeRouterOutage(outageId) : await refuseRouterOutageCredit(outageId);
      if (res.success) {
        toast.success(res.message);
        setReloadKey((key) => key + 1);
      } else {
        toast.error(res.message);
      }
    } finally {
      setBusy(false);
      setConfirming(null);
    }
  }

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
  }, [routerId, reloadKey]);

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
                <span className="basis-full text-xs text-muted-foreground">
                  {outageCreditLabel(outage)}
                  {outage.outageSmsCount != null ? ` · outage SMS to ${outage.outageSmsCount} phone ${outage.outageSmsCount === 1 ? "number" : "numbers"}` : ""}
                </span>
                {(outage.status === "OPEN" || outage.creditStatus === "APPLIED" || outage.creditStatus === "PENDING") && (
                  <span className="basis-full">
                    {confirming?.endsWith(outage.id) ? (
                      <span className="inline-flex items-center gap-2 text-xs">
                        <button type="button" disabled={busy}
                          onClick={() => act(confirming.startsWith("close") ? "close" : "refuse", outage.id)}
                          className="rounded-md bg-destructive px-2 py-1 font-medium text-white disabled:opacity-50">
                          {busy ? "Working…" : "Confirm"}
                        </button>
                        <button type="button" disabled={busy} onClick={() => setConfirming(null)} className="text-muted-foreground">
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-3 text-xs">
                        {outage.status === "OPEN" && (
                          <button type="button" onClick={() => setConfirming(`close:${outage.id}`)}
                            title="For a retired router or a false alarm. Nothing is given back for an outage closed by hand."
                            className="font-medium text-foreground underline-offset-2 hover:underline">
                            Close by hand
                          </button>
                        )}
                        {outage.status === "CLOSED" && (
                          <button type="button" onClick={() => setConfirming(`refuse:${outage.id}`)}
                            title="For a planned restart or maintenance. Time already given back is taken back from sessions still running."
                            className="font-medium text-destructive underline-offset-2 hover:underline">
                            Refuse credit
                          </button>
                        )}
                        <span className="text-muted-foreground">Administrators only</span>
                      </span>
                    )}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
