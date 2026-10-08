"use client";

import { useEffect, useState } from "react";
import { Loader2, Pause, Play } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  addPppoeDays,
  getPppoeSubscriptionTime,
  pausePppoeSubscription,
  resumePppoeSubscription,
} from "@/actions/subscriberTime";
import type { ActionResult, PppoeSubscriptionTime } from "@/lib/types/subscriberTime";
import { formatCustomerDate } from "@/lib/utils/customerFormatters";

const FIELD =
  "h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-ring";
const PRESET_DAYS = [1, 3, 7];

/**
 * Add days to, pause or resume one PPPoE subscription. PPPoE expiry is a date, so time is
 * added in whole days. The server decides what is allowed and its answer is shown as it is.
 */
export function ManagePppoeSubscriptionDialog({
  subscription,
  onClose,
  onChanged,
}: {
  subscription: { id: string; packageName: string | null } | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [time, setTime] = useState<PppoeSubscriptionTime | null>(null);
  const [loadError, setLoadError] = useState("");
  const [days, setDays] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const subscriptionId = subscription?.id;

  useEffect(() => {
    if (!subscriptionId) return;
    let cancelled = false;
    getPppoeSubscriptionTime(subscriptionId).then((res) => {
      if (cancelled) return;
      setTime(res.success ? res.data : null);
      setLoadError(res.success ? "" : res.message);
    });
    return () => {
      cancelled = true;
    };
  }, [subscriptionId]);

  function close() {
    setTime(null);
    setLoadError("");
    setDays("");
    setReason("");
    onClose();
  }

  function needReason(): boolean {
    if (reason.trim()) return true;
    toast.error("Write the reason first. It is kept with the change.");
    return false;
  }

  async function run(call: () => Promise<ActionResult<PppoeSubscriptionTime>>) {
    setBusy(true);
    try {
      const res = await call();
      if (res.success) {
        setTime(res.data);
        setDays("");
        toast.success(res.message);
        onChanged();
      } else {
        toast.error(res.message);
      }
    } finally {
      setBusy(false);
    }
  }

  function addDays(count: number) {
    if (!subscriptionId || !needReason()) return;
    if (!Number.isInteger(count) || count <= 0) {
      toast.error("Enter a whole number of days.");
      return;
    }
    void run(() => addPppoeDays(subscriptionId, count, reason.trim()));
  }

  const pausesLeft = time ? Math.max(0, time.pausesAllowed - time.pausesUsed) : 0;
  const canAct = time != null && (time.paused || time.status === "ACTIVE");

  return (
    <Dialog open={subscription != null} onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{subscription?.packageName ?? "Subscription"}</DialogTitle>
          <DialogDescription>{time?.username ? `PPPoE user ${time.username}` : "PPPoE subscription"}</DialogDescription>
        </DialogHeader>

        {loadError && <p role="alert" className="text-sm text-destructive">{loadError}</p>}
        {!time && !loadError && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </p>
        )}

        {time && (
          <div className="space-y-5">
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
              {time.paused ? (
                <>
                  <p className="font-medium">Paused · {time.pausedRemainingDays ?? 0} day(s) left</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    The days are kept. Resuming gives them back, counted from the day of resuming.
                  </p>
                </>
              ) : (
                <p className="font-medium">
                  {time.status === "ACTIVE" ? "Running" : time.status} · ends {formatCustomerDate(time.expiryDate)}
                </p>
              )}
            </div>

            {!canAct ? (
              <p className="text-sm text-muted-foreground">
                This subscription has ended. Renew it instead of adding time.
              </p>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label htmlFor="pppoe-reason" className="text-xs font-medium text-muted-foreground">
                    Reason (needed to add time or pause)
                  </label>
                  <input id="pppoe-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300}
                    placeholder="e.g. Fibre cut on 6 October" className={`${FIELD} w-full`} />
                </div>

                <section className="space-y-2">
                  <h3 className="text-sm font-medium">Add time</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    {PRESET_DAYS.map((count) => (
                      <Button key={count} type="button" variant="outline" size="sm" disabled={busy} onClick={() => addDays(count)}>
                        + {count} {count === 1 ? "day" : "days"}
                      </Button>
                    ))}
                    <input type="number" min={1} step={1} inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value)}
                      aria-label="Days to add" placeholder="Other" className={`${FIELD} w-24`} />
                    <Button type="button" size="sm" disabled={busy || !days} onClick={() => addDays(Number(days))}>Add</Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    PPPoE time is counted in whole days. More than one day at a time needs a company or system administrator.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="text-sm font-medium">{time.paused ? "Resume" : "Pause"}</h3>
                  {time.paused ? (
                    <Button type="button" size="sm" disabled={busy} onClick={() => subscriptionId && void run(() => resumePppoeSubscription(subscriptionId))}>
                      <Play className="h-4 w-4" /> Resume now
                    </Button>
                  ) : time.pausesAllowed === 0 ? (
                    <p className="text-xs text-muted-foreground">Only packages longer than one day can be paused.</p>
                  ) : (
                    <>
                      <p className="text-xs text-muted-foreground">
                        Disconnects the customer and keeps their remaining days until someone resumes. {time.pausesUsed} of{" "}
                        {time.pausesAllowed} pauses used.
                      </p>
                      <Button type="button" variant="outline" size="sm" disabled={busy || pausesLeft === 0}
                        onClick={() => subscriptionId && needReason() && void run(() => pausePppoeSubscription(subscriptionId, reason.trim()))}>
                        <Pause className="h-4 w-4" /> {pausesLeft === 0 ? "No pauses left" : "Pause"}
                      </Button>
                    </>
                  )}
                </section>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
