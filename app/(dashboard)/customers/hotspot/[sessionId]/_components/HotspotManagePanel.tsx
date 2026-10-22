"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Clock, Pause, Play, Power } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { addHotspotTime, pauseHotspotSession, resumeHotspotSession } from "@/actions/subscriberTime";
import { disconnectLiveSession } from "@/actions/sessions";
import type { HotspotSessionTime } from "@/lib/types/subscriberTime";
import { formatTimeLeft, toMinutes } from "@/lib/utils/subscriberTime";

const PRESETS: { label: string; minutes: number }[] = [
  { label: "30 min", minutes: 30 },
  { label: "1 hour", minutes: 60 },
  { label: "3 hours", minutes: 180 },
  { label: "1 day", minutes: 1440 },
];

type Unit = "minutes" | "hours" | "days";
type Busy = "add" | "pause" | "resume" | "disconnect" | null;

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
  onChanged,
}: {
  sessionId: number;
  time: HotspotSessionTime;
  secondsLeft: number | null;
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
    void run("pause", () => pauseHotspotSession(sessionId, pauseReason.trim()), () => setPauseReason(""));
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

      {paused ? (
        <Card
          icon={<Play className="h-4 w-4 text-muted-foreground" />}
          title="Resume"
          blurb={`The customer gets ${formatTimeLeft(secondsLeft)} from the moment you resume, and connects again the next time their device joins the Wi-Fi.`}
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
              : `Disconnects the customer and stops the clock until someone resumes it. ${time.pausesUsed} of ${time.pausesAllowed} pauses used.`
          }
        >
          {time.pausesAllowed > 0 && (
            <>
              <ReasonField id="pause-reason" value={pauseReason} onChange={setPauseReason} placeholder="e.g. Customer travelling until Friday" />
              <div className="mt-auto">
                <Button type="button" variant="outline" size="sm" disabled={busy != null || pausesLeft === 0} onClick={pause}>
                  <Pause className="h-4 w-4" /> {busy === "pause" ? "Pausing…" : pausesLeft === 0 ? "No pauses left" : "Pause"}
                </Button>
              </div>
            </>
          )}
        </Card>
      )}

      {!paused && (
        <Card
          icon={<Power className="h-4 w-4 text-destructive" />}
          title="Disconnect"
          blurb="Ends the package now and removes the device from the router. The remaining time is lost."
        >
          <ReasonField id="disconnect-reason" value={disconnectReason} onChange={setDisconnectReason}
            placeholder="e.g. Shared the code with others" optional />
          <div className="mt-auto">
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
                <Power className="h-4 w-4" /> Disconnect
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
