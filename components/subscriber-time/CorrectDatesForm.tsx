"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * Correct dates for a hotspot package or a TV (administrators), like PPPoE's: the start, then the
 * end either as a date and time or as a length from the start in minutes, hours, days or months.
 * The server checks again: start not in the future, end after start, at most 366 days ahead;
 * an end that has passed ends the package now.
 */

type Unit = "minutes" | "hours" | "days" | "months";
type Mode = "date" | "length";

const LABEL = new Intl.DateTimeFormat("en-KE", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

/** A Date as the value of a datetime-local input, in the browser's own time zone. */
function toLocalInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromIso(iso?: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : toLocalInput(date);
}

/** start + amount of unit; months keep the day of the month where the calendar allows. */
export function addLength(start: Date, amount: number, unit: Unit): Date {
  const end = new Date(start.getTime());
  if (unit === "months") {
    end.setMonth(end.getMonth() + amount);
  } else {
    const minutes = unit === "minutes" ? amount : unit === "hours" ? amount * 60 : amount * 1440;
    end.setTime(end.getTime() + minutes * 60_000);
  }
  return end;
}

export function CorrectDatesForm({
  idPrefix,
  initialStart,
  initialEnd,
  busy,
  fieldClass,
  onSubmit,
}: {
  idPrefix: string;
  initialStart?: string | null;
  initialEnd?: string | null;
  busy: boolean;
  fieldClass: string;
  /** ISO times; the caller adds the reason and sends them. */
  onSubmit: (startsAt: string, endsAt: string) => void;
}) {
  const [now] = useState(() => Date.now());
  const [start, setStart] = useState(() => fromIso(initialStart));
  const [mode, setMode] = useState<Mode>("date");
  const [end, setEnd] = useState(() => fromIso(initialEnd));
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState<Unit>("days");

  const startDate = start ? new Date(start) : null;
  const endDate =
    mode === "date"
      ? end ? new Date(end) : null
      : startDate && Number(amount) > 0 ? addLength(startDate, Number(amount), unit) : null;
  const valid = startDate != null && endDate != null && !Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime())
    && endDate.getTime() > startDate.getTime();
  const endsNow = valid && endDate!.getTime() <= now;

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label htmlFor={`${idPrefix}-start`} className="text-xs font-medium text-muted-foreground">Started</label>
        <input id={`${idPrefix}-start`} type="datetime-local" value={start} max={toLocalInput(new Date(now))}
          onChange={(e) => setStart(e.target.value)} className={`${fieldClass} w-full`} />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground">Ends</span>
          <div role="group" aria-label="How to give the end" className="inline-flex rounded-md border border-border p-0.5 text-xs">
            {([["date", "Date & time"], ["length", "Length"]] as const).map(([value, label]) => (
              <button key={value} type="button" aria-pressed={mode === value} onClick={() => setMode(value)}
                className={`rounded px-2 py-0.5 ${mode === value ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
        {mode === "date" ? (
          <input id={`${idPrefix}-end`} aria-label="Ends at" type="datetime-local" value={end}
            onChange={(e) => setEnd(e.target.value)} className={`${fieldClass} w-full`} />
        ) : (
          <div className="flex gap-2">
            <input type="number" min={1} inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)}
              aria-label="Length from the start" placeholder="Length" className={`${fieldClass} w-28`} />
            <select value={unit} onChange={(e) => setUnit(e.target.value as Unit)} aria-label="Length unit" className={fieldClass}>
              <option value="minutes">minutes</option>
              <option value="hours">hours</option>
              <option value="days">days</option>
              <option value="months">months</option>
            </select>
          </div>
        )}
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {!startDate || !endDate
            ? "Give the start and the end."
            : !valid
              ? "The end must be after the start."
              : endsNow
                ? `Ends ${LABEL.format(endDate)}: that has passed, so the package ends now.`
                : `Ends ${LABEL.format(endDate)}.`}
        </p>
      </div>

      <Button type="button" variant={endsNow ? "destructive" : "outline"} size="sm" disabled={busy || !valid}
        onClick={() => valid && onSubmit(startDate!.toISOString(), endDate!.toISOString())}>
        {busy ? "Saving…" : endsNow ? "End the package now" : "Correct dates"}
      </Button>
    </div>
  );
}
