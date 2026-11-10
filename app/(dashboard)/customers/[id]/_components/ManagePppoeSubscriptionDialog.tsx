"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2, Pause, Play } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  addPppoeDays,
  correctPppoeDates,
  getPppoeSubscriptionTime,
  pausePppoeSubscription,
  resumePppoeSubscription,
} from "@/actions/subscriberTime";
import type { ActionResult, PppoeSubscriptionTime } from "@/lib/types/subscriberTime";
import { formatCustomerDate } from "@/lib/utils/customerFormatters";
import { ResumeAtField, resumeAtIso, resumeAtLabel } from "@/components/subscriber-time/ResumeAtField";

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
  const [newStart, setNewStart] = useState("");
  const [newExpiry, setNewExpiry] = useState("");
  const [resumeAt, setResumeAt] = useState("");
  const subscriptionId = subscription?.id;
  const role = (useSession().data?.user?.role ?? "").replace(/^ROLE_/i, "").toUpperCase();
  // the backend enforces the same rule; this only hides what the caller cannot do
  const canCorrectDates = ["SYSADMIN", "ADMIN", "01"].includes(role);

  useEffect(() => {
    if (!subscriptionId) return;
    let cancelled = false;
    getPppoeSubscriptionTime(subscriptionId).then((res) => {
      if (cancelled) return;
      setTime(res.success ? res.data : null);
      setLoadError(res.success ? "" : res.message);
      if (res.success) {
        setNewStart(res.data.startDate ?? "");
        setNewExpiry(res.data.expiryDate ?? "");
      }
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
    setNewStart("");
    setNewExpiry("");
    setResumeAt("");
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
        setResumeAt("");
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

  function pause() {
    if (!subscriptionId || !needReason()) return;
    const until = resumeAtIso(resumeAt);
    if (until === undefined) {
      toast.error("Pick a resume time in the future, or leave it empty for someone to resume it.");
      return;
    }
    void run(() => pausePppoeSubscription(subscriptionId, reason.trim(), until));
  }

  function correctDates() {
    if (!subscriptionId || !needReason()) return;
    if (!newStart || !newExpiry) {
      toast.error("Give both dates.");
      return;
    }
    void run(() => correctPppoeDates(subscriptionId, newStart, newExpiry, reason.trim()));
  }

  const pausesLeft = time ? Math.max(0, time.pausesAllowed - time.pausesUsed) : 0;
  const canAct = time != null && (time.paused || time.status === "ACTIVE");

  return (
    <Dialog open={subscription != null} onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
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
                    {time.resumeAt ? ` Resumes by itself ${resumeAtLabel(time.resumeAt)}.` : ""}
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
                    Reason (needed to add time, pause or correct dates)
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
                        Disconnects the customer and keeps their remaining days until the resume time, or until someone
                        resumes. {time.pausesUsed} of{" "}
                        {time.pausesAllowed} pauses used.
                      </p>
                      <ResumeAtField id="pppoe-resume-at" value={resumeAt} onChange={setResumeAt} className={`${FIELD} w-full`} />
                      <Button type="button" variant="outline" size="sm" disabled={busy || pausesLeft === 0} onClick={pause}>
                        <Pause className="h-4 w-4" /> {pausesLeft === 0 ? "No pauses left" : "Pause"}
                      </Button>
                    </>
                  )}
                </section>

                {canCorrectDates && !time.paused && (
                  <section className="space-y-2 border-t border-border pt-4">
                    <h3 className="text-sm font-medium">Correct dates</h3>
                    <p className="text-xs text-muted-foreground">
                      For mistakes, such as a wrong start date or too much time given. It can shorten the
                      subscription and records no payment. An expiry of today or earlier ends it now and
                      disconnects the customer.
                    </p>
                    <div className="flex flex-wrap items-end gap-2">
                      <label className="space-y-1 text-xs text-muted-foreground">
                        <span className="block">Start</span>
                        <input type="date" value={newStart} onChange={(e) => setNewStart(e.target.value)}
                          aria-label="Start date" className={FIELD} />
                      </label>
                      <label className="space-y-1 text-xs text-muted-foreground">
                        <span className="block">Expiry</span>
                        <input type="date" value={newExpiry} onChange={(e) => setNewExpiry(e.target.value)}
                          aria-label="Expiry date" className={FIELD} />
                      </label>
                      <Button type="button" variant="outline" size="sm" onClick={correctDates}
                        disabled={busy || !newStart || !newExpiry
                          || (newStart === (time.startDate ?? "") && newExpiry === (time.expiryDate ?? ""))}>
                        Save dates
                      </Button>
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
