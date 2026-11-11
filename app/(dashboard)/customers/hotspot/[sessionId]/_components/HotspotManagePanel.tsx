"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { CalendarClock, Clock, Pause, Play, Power, Smartphone, UserX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  addHotspotTime, changeHotspotDevice, correctHotspotDates, deactivateHotspotSession, pauseHotspotSession, resumeHotspotSession,
} from "@/actions/subscriberTime";
import { disconnectLiveSession } from "@/actions/sessions";
import type { HotspotSessionTime } from "@/lib/types/subscriberTime";
import { formatTimeLeft, toMinutes } from "@/lib/utils/subscriberTime";
import { ResumeAtField, resumeAtIso, resumeAtLabel } from "@/components/subscriber-time/ResumeAtField";
import { CorrectDatesForm } from "@/components/subscriber-time/CorrectDatesForm";

const PRESETS: { label: string; minutes: number }[] = [
  { label: "30 min", minutes: 30 },
  { label: "1 hour", minutes: 60 },
  { label: "3 hours", minutes: 180 },
  { label: "1 day", minutes: 1440 },
];

type Unit = "minutes" | "hours" | "days";
type Busy = "add" | "pause" | "resume" | "device" | "deactivate" | "dates" | "disconnect" | null;

const FIELD =
  "h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-ring";

function Card({ icon, title, blurb, children }: { icon: ReactNode; title: string; blurb: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5">
      <div>
        <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
          {icon}
          {title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{blurb}</p>
      </div>
      {children}
    </section>
  );
}

function ReasonField({ id, value, onChange, placeholder, optional }: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  optional?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        Reason{optional ? " (optional)" : ""}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={300}
        placeholder={placeholder}
        className={`${FIELD} w-full`}
      />
    </div>
  );
}

/**
 * What customer care can do for one hotspot customer, one card per action. The server decides
 * what is allowed and answers in a sentence, which is shown as it is.
 */
export function HotspotManagePanel({
  sessionId,
  time,
  secondsLeft,
  deviceMac,
  onChanged,
}: {
  sessionId: number;
  time: HotspotSessionTime;
  secondsLeft: number | null;
  /** The device the router last saw on this purchase, when known. */
  deviceMac?: string | null;
  onChanged: (time: HotspotSessionTime | null) => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<Busy>(null);
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState<Unit>("hours");
  const [addReason, setAddReason] = useState("");
  const [pauseReason, setPauseReason] = useState("");
  const [disconnectReason, setDisconnectReason] = useState("");
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [resumeAt, setResumeAt] = useState("");
  const [newMac, setNewMac] = useState("");
  const [deviceReason, setDeviceReason] = useState("");
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [datesReason, setDatesReason] = useState("");
  const role = (useSession()?.data?.user?.role ?? "").replace(/^ROLE_/i, "").toUpperCase();
  // Correcting the device: company and system administrators and management (the server checks too).
  const canCorrectDevice = ["SYSADMIN", "ADMIN", "01", "02"].includes(role);
  // Deactivate / Activate: the same people (the server checks too).
  const canDeactivate = canCorrectDevice;
  // Correct dates: company and system administrators only, as for PPPoE.
  const canCorrectDates = ["SYSADMIN", "ADMIN", "01"].includes(role);

  const paused = time.status === "PAUSED";
  const pausesLeft = Math.max(0, time.pausesAllowed - time.pausesUsed);

  async function run(kind: Exclude<Busy, null | "disconnect">, call: () => ReturnType<typeof addHotspotTime>, after?: () => void) {
    setBusy(kind);
    try {
      const res = await call();
      if (res.success) {
        toast.success(res.message);
        after?.();
        onChanged(res.data);
      } else {
        toast.error(res.message);
      }
    } finally {
      setBusy(null);
    }
  }

  function addMinutes(minutes: number) {
    if (!addReason.trim()) {
      toast.error("Write why the time is added. It is kept with the change.");
      return;
    }
    if (!Number.isFinite(minutes) || minutes <= 0) {
      toast.error("Enter how much time to add.");
      return;
    }
    void run("add", () => addHotspotTime(sessionId, minutes, addReason.trim()), () => {
      setAmount("");
      setAddReason("");
    });
  }

  function pause() {
    if (!pauseReason.trim()) {
      toast.error("Write why the package is paused. It is kept with the change.");
      return;
    }
    const until = resumeAtIso(resumeAt);
    if (until === undefined) {
      toast.error("Pick a resume time in the future, or leave it empty for someone to resume it.");
      return;
    }
    void run("pause", () => pauseHotspotSession(sessionId, pauseReason.trim(), until), () => {
      setPauseReason("");
      setResumeAt("");
    });
  }

  function changeDevice(remove: boolean) {
    if (!deviceReason.trim()) {
      toast.error("Write why the device is changed. It is kept with the change.");
      return;
    }
    if (!remove && !newMac.trim()) {
      toast.error("Enter the new device's MAC address, like AA:BB:CC:DD:EE:FF.");
      return;
    }
    void run("device", () => changeHotspotDevice(sessionId, remove ? "" : newMac.trim(), deviceReason.trim()), () => {
      setNewMac("");
      setDeviceReason("");
      setConfirmRemove(false);
    });
  }

  function deactivate() {
    if (!disconnectReason.trim()) {
      toast.error("Write why the package is deactivated. It is kept with the change.");
      return;
    }
    void run("deactivate", () => deactivateHotspotSession(sessionId, disconnectReason.trim()), () => {
      setDisconnectReason("");
      setConfirmDisconnect(false);
    });
  }

  function correctDates(startsAt: string, endsAt: string) {
    if (!datesReason.trim()) {
      toast.error("Write why the dates are corrected. It is kept with the change.");
      return;
    }
    void run("dates", () => correctHotspotDates(sessionId, startsAt, endsAt, datesReason.trim()), () => setDatesReason(""));
  }

  async function disconnect() {
    setBusy("disconnect");
    try {
      const res = await disconnectLiveSession(sessionId, disconnectReason.trim() || "Disconnected from the hotspot customer page");
      if (res.success) {
        toast.success(res.message);
        router.push("/customers/all?view=hotspot");
        router.refresh();
      } else {
        toast.error(res.message);
      }
    } finally {
      setBusy(null);
      setConfirmDisconnect(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card
        icon={<Clock className="h-4 w-4 text-muted-foreground" />}
        title="Add time"
        blurb={
          paused
            ? "Added time is kept with the paused time and given back on resume."
            : "Extends the package at once. More than one day at a time needs a company or system administrator."
        }
      >
        <ReasonField id="add-reason" value={addReason} onChange={setAddReason} placeholder="e.g. Outage at Westlands on Monday" />
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
            className={`${FIELD} w-32`}
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
      </Card>

      {paused && time.deactivated ? (
        <Card
          icon={<Play className="h-4 w-4 text-muted-foreground" />}
          title="Activate"
          blurb={`Deactivated by staff. Activating gives the customer ${formatTimeLeft(secondsLeft)} from that moment; their device connects again the next time it joins the Wi-Fi.`}
        >
          <div className="mt-auto">
            {canDeactivate ? (
              <Button type="button" size="sm" disabled={busy != null}
                onClick={() => void run("resume", () => resumeHotspotSession(sessionId))}>
                <Play className="h-4 w-4" /> {busy === "resume" ? "Activating…" : "Activate"}
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground">Only an administrator or management can activate it.</p>
            )}
          </div>
        </Card>
      ) : paused ? (
        <Card
          icon={<Play className="h-4 w-4 text-muted-foreground" />}
          title="Resume"
          blurb={`${time.resumeAt ? `Resumes by itself ${resumeAtLabel(time.resumeAt)}. ` : ""}The customer gets ${formatTimeLeft(secondsLeft)} from the moment it resumes, and connects again the next time their device joins the Wi-Fi.`}
        >
          <div className="mt-auto">
            <Button type="button" size="sm" disabled={busy != null}
              onClick={() => void run("resume", () => resumeHotspotSession(sessionId))}>
              <Play className="h-4 w-4" /> {busy === "resume" ? "Resuming…" : "Resume now"}
            </Button>
          </div>
        </Card>
      ) : (
        <Card
          icon={<Pause className="h-4 w-4 text-muted-foreground" />}
          title="Pause"
          blurb={
            time.pausesAllowed === 0
              ? "Only packages longer than one day can be paused. This one cannot."
              : `Disconnects the customer and stops the clock until the resume time, or until someone resumes it. ${time.pausesUsed} of ${time.pausesAllowed} pauses used.`
          }
        >
          {time.pausesAllowed > 0 && (
            <>
              <ReasonField id="pause-reason" value={pauseReason} onChange={setPauseReason} placeholder="e.g. Customer travelling until Friday" />
              <ResumeAtField id="pause-resume-at" value={resumeAt} onChange={setResumeAt} className={`${FIELD} w-full`} />
              <div className="mt-auto">
                <Button type="button" variant="outline" size="sm" disabled={busy != null || pausesLeft === 0} onClick={pause}>
                  <Pause className="h-4 w-4" /> {busy === "pause" ? "Pausing…" : pausesLeft === 0 ? "No pauses left" : "Pause"}
                </Button>
              </div>
            </>
          )}
        </Card>
      )}

      {canCorrectDevice && (
        <Card
          icon={<Smartphone className="h-4 w-4 text-muted-foreground" />}
          title="Device"
          blurb={
            <>
              Ties this purchase to another device, or removes a wrong one so the customer can sign in again with the
              code. {deviceMac ? <>The router last saw <span className="font-mono">{deviceMac}</span>.</> : null}
            </>
          }
        >
          <div className="space-y-1.5">
            <label htmlFor="device-mac" className="text-xs font-medium text-muted-foreground">New MAC address</label>
            <input
              id="device-mac" value={newMac} onChange={(e) => setNewMac(e.target.value)} maxLength={17}
              placeholder="AA:BB:CC:DD:EE:FF" autoComplete="off" spellCheck={false}
              className={`${FIELD} w-full font-mono uppercase`}
            />
          </div>
          <ReasonField id="device-reason" value={deviceReason} onChange={setDeviceReason} placeholder="e.g. Paid from the wrong phone" />
          <div className="mt-auto flex flex-wrap gap-2">
            <Button type="button" size="sm" disabled={busy != null || !newMac.trim()} onClick={() => changeDevice(false)}>
              {busy === "device" && !confirmRemove ? "Saving…" : "Use this device"}
            </Button>
            {confirmRemove ? (
              <>
                <Button type="button" variant="destructive" size="sm" disabled={busy != null} onClick={() => changeDevice(true)}>
                  {busy === "device" ? "Removing…" : "Yes, remove the device"}
                </Button>
                <Button type="button" variant="ghost" size="sm" disabled={busy != null} onClick={() => setConfirmRemove(false)}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button type="button" variant="outline" size="sm" disabled={busy != null} onClick={() => setConfirmRemove(true)}>
                Remove device
              </Button>
            )}
          </div>
        </Card>
      )}

      {!paused && (
        <Card
          icon={<Power className="h-4 w-4 text-destructive" />}
          title="Disconnect"
          blurb={canDeactivate
            ? "Deactivate signs the device off and keeps the time left until someone activates it, for any package. End package ends it now; the time left is lost."
            : "Ends the package now and removes the device from the router. The remaining time is lost."}
        >
          <ReasonField id="disconnect-reason" value={disconnectReason} onChange={setDisconnectReason}
            placeholder="e.g. Shared the code with others" optional={!canDeactivate} />
          <div className="mt-auto flex flex-wrap gap-2">
            {canDeactivate && !confirmDisconnect && (
              <Button type="button" variant="outline" size="sm" disabled={busy != null} onClick={deactivate}>
                <UserX className="h-4 w-4" /> {busy === "deactivate" ? "Deactivating…" : "Deactivate"}
              </Button>
            )}
            {confirmDisconnect ? (
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="destructive" size="sm" disabled={busy != null} onClick={disconnect}>
                  {busy === "disconnect" ? "Disconnecting…" : "Yes, end the package"}
                </Button>
                <Button type="button" variant="ghost" size="sm" disabled={busy != null} onClick={() => setConfirmDisconnect(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button type="button" variant="outline" size="sm" className="text-destructive" disabled={busy != null}
                onClick={() => setConfirmDisconnect(true)}>
                <Power className="h-4 w-4" /> End package
              </Button>
            )}
          </div>
        </Card>
      )}

      {!paused && canCorrectDates && (
        <Card
          icon={<CalendarClock className="h-4 w-4 text-muted-foreground" />}
          title="Correct dates"
          blurb="For mistakes, such as a wrong start or too much time given. It can shorten the package and records no payment."
        >
          <ReasonField id="dates-reason" value={datesReason} onChange={setDatesReason} placeholder="e.g. Sold a day instead of 5 hours" />
          <CorrectDatesForm key={`${time.startedAt}-${time.expiresAt}`} idPrefix="hotspot-dates" initialStart={time.startedAt}
            initialEnd={time.expiresAt} busy={busy != null} fieldClass={FIELD} onSubmit={correctDates} />
        </Card>
      )}
    </div>
  );
}
