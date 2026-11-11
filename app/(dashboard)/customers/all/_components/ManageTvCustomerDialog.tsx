"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { CalendarClock, Clock, Loader2, Pause, Play, Power, Tv, UserX } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  addTvTime, changeTvDevice, correctTvDates, deactivateTvCustomer, endTvPackage, getTvCustomer, pauseTvCustomer, resumeTvCustomer,
} from "@/actions/subscriberTime";
import { CorrectDatesForm } from "@/components/subscriber-time/CorrectDatesForm";
import { ResumeAtField, resumeAtIso, resumeAtLabel } from "@/components/subscriber-time/ResumeAtField";
import type { TvCustomerTime } from "@/lib/types/subscriberTime";
import { formatLocalPhone, formatTimeLeft, toMinutes } from "@/lib/utils/subscriberTime";

const PRESETS: { label: string; minutes: number }[] = [
  { label: "30 min", minutes: 30 },
  { label: "1 hour", minutes: 60 },
  { label: "3 hours", minutes: 180 },
  { label: "1 day", minutes: 1440 },
];

type Unit = "minutes" | "hours" | "days";
type Busy = "add" | "pause" | "resume" | "device" | "deactivate" | "end" | "dates" | null;

const FIELD =
  "h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-ring";

function secondsLeft(time: TvCustomerTime, now: number): number | null {
  if (time.status === "PAUSED") return time.pausedRemainingSeconds;
  if (!time.expiresAt) return null;
  return Math.max(0, Math.round((new Date(time.expiresAt).getTime() - now) / 1000));
}

/**
 * Everything customer care can do for one TV: add time, pause or resume. The server decides
 * what is allowed and answers in a sentence, which is shown as it is.
 */
export function ManageTvCustomerDialog({
  tv,
  onClose,
  onChanged,
}: {
  tv: TvCustomerTime | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [time, setTime] = useState<TvCustomerTime | null>(null);
  const [loadError, setLoadError] = useState("");
  const [loadedAt, setLoadedAt] = useState(0);
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState<Unit>("hours");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState<Busy>(null);
  const [resumeAt, setResumeAt] = useState("");
  const [newMac, setNewMac] = useState("");
  const role = (useSession()?.data?.user?.role ?? "").replace(/^ROLE_/i, "").toUpperCase();
  // Correcting the TV's address: company and system administrators and management (the server checks too).
  const canCorrectDevice = ["SYSADMIN", "ADMIN", "01", "02"].includes(role);
  // Deactivate, Activate and End package: the same people (the server checks too).
  const canDeactivate = canCorrectDevice;
  // Correct dates: company and system administrators only, as for PPPoE.
  const canCorrectDates = ["SYSADMIN", "ADMIN", "01"].includes(role);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const entitlementId = tv?.entitlementId;

  useEffect(() => {
    if (entitlementId == null) return;
    let cancelled = false;
    getTvCustomer(entitlementId).then((res) => {
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
  }, [entitlementId]);

  function close() {
    setTime(null);
    setLoadError("");
    setAmount("");
    setReason("");
    setResumeAt("");
    setNewMac("");
    onClose();
  }

  function needReason(): boolean {
    if (reason.trim()) return true;
    toast.error("Write the reason first. It is kept with the change.");
    return false;
  }

  async function run(kind: Exclude<Busy, null>, call: () => ReturnType<typeof addTvTime>) {
    setBusy(kind);
    try {
      const res = await call();
      if (res.success) {
        setTime(res.data);
        setLoadedAt(Date.now());
        setAmount("");
        setResumeAt("");
        setNewMac("");
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
    if (entitlementId == null || !needReason()) return;
    if (!Number.isFinite(minutes) || minutes <= 0) {
      toast.error("Enter how much time to add.");
      return;
    }
    void run("add", () => addTvTime(entitlementId, minutes, reason.trim()));
  }

  function pause() {
    if (entitlementId == null || !needReason()) return;
    const until = resumeAtIso(resumeAt);
    if (until === undefined) {
      toast.error("Pick a resume time in the future, or leave it empty for someone to resume it.");
      return;
    }
    void run("pause", () => pauseTvCustomer(entitlementId, reason.trim(), until));
  }

  function correctAddress() {
    if (entitlementId == null || !needReason()) return;
    if (!newMac.trim()) {
      toast.error("Enter the TV's MAC address, like AA:BB:CC:DD:EE:FF.");
      return;
    }
    void run("device", () => changeTvDevice(entitlementId, newMac.trim(), reason.trim()));
  }

  function deactivate() {
    if (entitlementId == null || !needReason()) return;
    void run("deactivate", () => deactivateTvCustomer(entitlementId, reason.trim()));
  }

  async function endPackage() {
    if (entitlementId == null || !needReason()) return;
    setBusy("end");
    try {
      const res = await endTvPackage(entitlementId, reason.trim());
      if (res.success) {
        toast.success(res.message);
        onChanged();
        close();
      } else {
        toast.error(res.message);
      }
    } finally {
      setBusy(null);
      setConfirmEnd(false);
    }
  }

  function correctDates(startsAt: string, endsAt: string) {
    if (entitlementId == null || !needReason()) return;
    void run("dates", () => correctTvDates(entitlementId, startsAt, endsAt, reason.trim()));
  }

  const paused = time?.status === "PAUSED";
  const deactivated = paused && time?.deactivated === true;
  const left = time ? secondsLeft(time, loadedAt) : null;
  const pausesLeft = time ? Math.max(0, time.pausesAllowed - time.pausesUsed) : 0;

  return (
    <Dialog open={tv != null} onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="tabular-nums">{formatLocalPhone(tv?.phone) ?? "TV customer"}</DialogTitle>
          <DialogDescription>
            {tv?.packageName ?? "TV package"} · TV {time?.macAddress ?? tv?.macAddress}
            {tv?.routerName ? ` · ${tv.routerName}` : ""}
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
                {deactivated ? "Deactivated" : paused ? "Paused" : "Running"} · {formatTimeLeft(left)} left
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {paused
                  ? `The clock is stopped. Resuming gives this time back from that moment.${time.resumeAt ? ` Resumes by itself ${resumeAtLabel(time.resumeAt)}.` : ""}`
                  : time.expiresAt
                    ? `Ends ${new Date(time.expiresAt).toLocaleString()}`
                    : ""}
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="subscriber-reason" className="text-xs font-medium text-muted-foreground">
                Reason (needed for every change)
              </label>
              <input
                id="subscriber-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={300}
                placeholder="e.g. TV off while the customer travels"
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
              <h3 className="text-sm font-medium">{deactivated ? "Activate" : paused ? "Resume" : "Pause"}</h3>
              {deactivated ? (
                canDeactivate ? (
                  <>
                    <p className="text-xs text-muted-foreground">
                      Deactivated by staff. Activating gives the TV {formatTimeLeft(left)} from that moment; it is let back in
                      within a minute.
                    </p>
                    <Button type="button" size="sm" disabled={busy != null}
                      onClick={() => entitlementId != null && void run("resume", () => resumeTvCustomer(entitlementId))}>
                      <Play className="h-4 w-4" /> {busy === "resume" ? "Activating…" : "Activate"}
                    </Button>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">Deactivated by staff. Only an administrator or management can activate it.</p>
                )
              ) : paused ? (
                <>
                  <p className="text-xs text-muted-foreground">
                    {time.resumeAt ? `Resumes by itself ${resumeAtLabel(time.resumeAt)}. ` : ""}
                    The TV gets {formatTimeLeft(left)} from the moment it resumes and is let back in within a minute.
                    If it is not, turn the TV&apos;s Wi-Fi off and on.
                  </p>
                  <Button type="button" size="sm" disabled={busy != null}
                    onClick={() => entitlementId != null && void run("resume", () => resumeTvCustomer(entitlementId))}>
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
                    Disconnects the TV and stops the clock until the resume time, or until someone resumes it.{" "}
                    {time.pausesUsed} of{" "}
                    {time.pausesAllowed} pauses used.
                  </p>
                  <ResumeAtField id="tv-resume-at" value={resumeAt} onChange={setResumeAt} className={`${FIELD} w-full`} />
                  <Button type="button" variant="outline" size="sm" disabled={busy != null || pausesLeft === 0} onClick={pause}>
                    <Pause className="h-4 w-4" /> {busy === "pause" ? "Pausing…" : pausesLeft === 0 ? "No pauses left" : "Pause"}
                  </Button>
                </>
              )}
            </section>

            {canDeactivate && (
              <section className="space-y-2">
                <h3 className="flex items-center gap-2 text-sm font-medium">
                  <Power className="h-4 w-4 text-destructive" /> Disconnect
                </h3>
                <p className="text-xs text-muted-foreground">
                  {paused
                    ? "End package ends it now; the time left is lost."
                    : "Deactivate signs the TV off and keeps the time left until someone activates it, for any package. End package ends it now; the time left is lost."}
                </p>
                <div className="flex flex-wrap gap-2">
                  {!paused && !confirmEnd && (
                    <Button type="button" variant="outline" size="sm" disabled={busy != null} onClick={deactivate}>
                      <UserX className="h-4 w-4" /> {busy === "deactivate" ? "Deactivating…" : "Deactivate"}
                    </Button>
                  )}
                  {confirmEnd ? (
                    <>
                      <Button type="button" variant="destructive" size="sm" disabled={busy != null} onClick={endPackage}>
                        {busy === "end" ? "Ending…" : "Yes, end the package"}
                      </Button>
                      <Button type="button" variant="ghost" size="sm" disabled={busy != null} onClick={() => setConfirmEnd(false)}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button type="button" variant="outline" size="sm" className="text-destructive" disabled={busy != null}
                      onClick={() => setConfirmEnd(true)}>
                      <Power className="h-4 w-4" /> End package
                    </Button>
                  )}
                </div>
              </section>
            )}

            {!paused && canCorrectDates && (
              <section className="space-y-2 border-t border-border pt-4">
                <h3 className="flex items-center gap-2 text-sm font-medium">
                  <CalendarClock className="h-4 w-4 text-muted-foreground" /> Correct dates
                </h3>
                <p className="text-xs text-muted-foreground">
                  For mistakes, such as a wrong start or too much time given. It can shorten the package and records no payment.
                </p>
                <CorrectDatesForm key={`${time.startsAt}-${time.expiresAt}`} idPrefix="tv-dates" initialStart={time.startsAt}
                  initialEnd={time.expiresAt} busy={busy != null} fieldClass={FIELD} onSubmit={correctDates} />
              </section>
            )}

            {canCorrectDevice && (
              <section className="space-y-2">
                <h3 className="flex items-center gap-2 text-sm font-medium">
                  <Tv className="h-4 w-4 text-muted-foreground" /> TV address
                </h3>
                <p className="text-xs text-muted-foreground">
                  For a TV registered with a wrong MAC address, or one replaced by another TV. The old address is
                  removed from the router and the time left moves to the new one.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    value={newMac} onChange={(e) => setNewMac(e.target.value)} maxLength={17}
                    aria-label="The TV's correct MAC address" placeholder="AA:BB:CC:DD:EE:FF"
                    autoComplete="off" spellCheck={false}
                    className={`${FIELD} w-48 font-mono uppercase`}
                  />
                  <Button type="button" size="sm" disabled={busy != null || !newMac.trim()} onClick={correctAddress}>
                    {busy === "device" ? "Saving…" : "Correct address"}
                  </Button>
                </div>
              </section>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
