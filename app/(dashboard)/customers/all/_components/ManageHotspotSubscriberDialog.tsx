"use client";

import { useEffect, useState } from "react";
import { Clock, Loader2, Pause, Play, Power } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  addHotspotTime,
  getHotspotSessionTime,
  pauseHotspotSession,
  resumeHotspotSession,
} from "@/actions/subscriberTime";
import { disconnectLiveSession } from "@/actions/sessions";
import type { HotspotSessionTime } from "@/lib/types/subscriberTime";
import { formatTimeLeft, toMinutes } from "@/lib/utils/subscriberTime";

export interface ManagedSubscriber {
  sessionId: number;
  phone: string;
  packageName: string;
}

const PRESETS: { label: string; minutes: number }[] = [
  { label: "30 min", minutes: 30 },
  { label: "1 hour", minutes: 60 },
  { label: "3 hours", minutes: 180 },
  { label: "1 day", minutes: 1440 },
];

type Unit = "minutes" | "hours" | "days";
type Busy = "add" | "pause" | "resume" | "disconnect" | null;

const FIELD =
  "h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-ring";

function secondsLeft(time: HotspotSessionTime, now: number): number | null {
  if (time.status === "PAUSED") return time.pausedRemainingSeconds;
  if (!time.expiresAt) return null;
  return Math.max(0, Math.round((new Date(time.expiresAt).getTime() - now) / 1000));
}

/**
 * Everything customer care can do for one hotspot customer: add time, pause or resume,
 * disconnect. The server decides what is allowed and answers in a sentence, which is shown
 * as it is.
 */
export function ManageHotspotSubscriberDialog({
  subscriber,
  onClose,
  onChanged,
}: {
  subscriber: ManagedSubscriber | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [time, setTime] = useState<HotspotSessionTime | null>(null);
  const [loadError, setLoadError] = useState("");
  const [loadedAt, setLoadedAt] = useState(0);
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState<Unit>("hours");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState<Busy>(null);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const sessionId = subscriber?.sessionId;

  useEffect(() => {
    if (sessionId == null) return;
    let cancelled = false;
    getHotspotSessionTime(sessionId).then((res) => {
      if (cancelled) return;
      if (res.success) {
        setTime(res.data);
        setLoadError("");
      } else {
        setTime(null);
        setLoadError(res.message);
      }
      setLoadedAt(Date.now());
    });
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  function close() {
    setTime(null);
    setLoadError("");
    setAmount("");
    setReason("");
    setConfirmDisconnect(false);
    onClose();
  }

  function needReason(): boolean {
    if (reason.trim()) return true;
    toast.error("Write the reason first. It is kept with the change.");
    return false;
  }

  async function run(kind: Exclude<Busy, null | "disconnect">, call: () => ReturnType<typeof addHotspotTime>) {
    setBusy(kind);
    try {
      const res = await call();
      if (res.success) {
        setTime(res.data);
        setLoadedAt(Date.now());
        setAmount("");
        toast.success(res.message);
        onChanged();
      } else {
        toast.error(res.message);
      }
    } finally {
      setBusy(null);
    }
  }

  function addMinutes(minutes: number) {
    if (sessionId == null || !needReason()) return;
    if (!Number.isFinite(minutes) || minutes <= 0) {
      toast.error("Enter how much time to add.");
      return;
    }
    void run("add", () => addHotspotTime(sessionId, minutes, reason.trim()));
  }

  async function disconnect() {
    if (sessionId == null) return;
    setBusy("disconnect");
    try {
      const res = await disconnectLiveSession(sessionId, reason.trim() || "Disconnected from the customer directory");
      if (res.success) {
        toast.success(res.message);
        onChanged();
        close();
      } else {
        toast.error(res.message);
      }
    } finally {
      setBusy(null);
      setConfirmDisconnect(false);
    }
  }

  const paused = time?.status === "PAUSED";
  const left = time ? secondsLeft(time, loadedAt) : null;
  const pausesLeft = time ? Math.max(0, time.pausesAllowed - time.pausesUsed) : 0;

  return (
    <Dialog open={subscriber != null} onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="tabular-nums">{subscriber?.phone}</DialogTitle>
          <DialogDescription>
            {subscriber?.packageName}
            {time?.voucherCode ? ` · code ${time.voucherCode}` : ""}
          </DialogDescription>
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
              <p className="flex items-center gap-2 font-medium">
                <Clock className="h-4 w-4 text-muted-foreground" />
                {paused ? "Paused" : "Running"} · {formatTimeLeft(left)} left
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {paused
                  ? "The clock is stopped. Resuming gives this time back from that moment."
                  : time.expiresAt
                    ? `Ends ${new Date(time.expiresAt).toLocaleString()}`
                    : ""}
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="subscriber-reason" className="text-xs font-medium text-muted-foreground">
                Reason (needed to add time or pause)
              </label>
              <input
                id="subscriber-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={300}
                placeholder="e.g. Customer travelling until Friday"
                className={`${FIELD} w-full`}
              />
            </div>

            <section className="space-y-2">
              <h3 className="text-sm font-medium">Add time</h3>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((preset) => (
                  <Button key={preset.label} type="button" variant="outline" size="sm" disabled={busy != null}
                    onClick={() => addMinutes(preset.minutes)}>
                    + {preset.label}
                  </Button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="number" min={1} inputMode="numeric" value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  aria-label="Amount of time to add" placeholder="Other amount"
                  className={`${FIELD} w-36`}
                />
                <select value={unit} onChange={(e) => setUnit(e.target.value as Unit)} aria-label="Unit" className={FIELD}>
                  <option value="minutes">minutes</option>
                  <option value="hours">hours</option>
                  <option value="days">days</option>
                </select>
                <Button type="button" size="sm" disabled={busy != null || !amount}
                  onClick={() => addMinutes(toMinutes(Number(amount), unit))}>
                  {busy === "add" ? "Adding…" : "Add"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                More than one day at a time needs a company or system administrator.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-medium">{paused ? "Resume" : "Pause"}</h3>
              {paused ? (
                <>
                  <p className="text-xs text-muted-foreground">
                    The customer gets {formatTimeLeft(left)} from the moment you resume, and connects again the next
                    time their device joins the Wi-Fi.
                  </p>
                  <Button type="button" size="sm" disabled={busy != null}
                    onClick={() => sessionId != null && void run("resume", () => resumeHotspotSession(sessionId))}>
                    <Play className="h-4 w-4" /> {busy === "resume" ? "Resuming…" : "Resume now"}
                  </Button>
                </>
              ) : time.pausesAllowed === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Only packages longer than one day can be paused. This one cannot.
                </p>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">
                    Disconnects the customer and stops the clock until someone resumes it. {time.pausesUsed} of{" "}
                    {time.pausesAllowed} pauses used.
                  </p>
                  <Button type="button" variant="outline" size="sm" disabled={busy != null || pausesLeft === 0}
                    onClick={() => sessionId != null && needReason() && void run("pause", () => pauseHotspotSession(sessionId, reason.trim()))}>
                    <Pause className="h-4 w-4" /> {busy === "pause" ? "Pausing…" : pausesLeft === 0 ? "No pauses left" : "Pause"}
                  </Button>
                </>
              )}
            </section>

            {!paused && (
              <section className="space-y-2 border-t border-border pt-4">
                <h3 className="text-sm font-medium">Disconnect</h3>
                <p className="text-xs text-muted-foreground">
                  Ends the package now and removes the device from the router. The remaining time is lost.
                </p>
                {confirmDisconnect ? (
                  <div className="flex gap-2">
                    <Button type="button" variant="destructive" size="sm" disabled={busy != null} onClick={disconnect}>
                      {busy === "disconnect" ? "Disconnecting…" : "Yes, end the package"}
                    </Button>
                    <Button type="button" variant="ghost" size="sm" disabled={busy != null} onClick={() => setConfirmDisconnect(false)}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button type="button" variant="ghost" size="sm" className="text-destructive" disabled={busy != null}
                    onClick={() => setConfirmDisconnect(true)}>
                    <Power className="h-4 w-4" /> Disconnect
                  </Button>
                )}
              </section>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
