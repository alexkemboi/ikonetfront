"use client";

import { useState } from "react";

/**
 * The optional date and time a pause ends by itself. Empty: someone presses Resume, as before.
 * The server accepts a time more than a minute ahead and at most 90 days ahead.
 */

const MAX_DAYS = 90;
const LABEL = new Intl.DateTimeFormat("en-KE", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

/** A Date as the value of a datetime-local input, in the browser's own time zone. */
function toLocalInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * The input's value as an ISO time for the server: null when empty, undefined when it is not a
 * time in the future (the caller tells the operator).
 */
export function resumeAtIso(value: string): string | null | undefined {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now() + 60_000) return undefined;
  return date.toISOString();
}

/** "on Fri 14 Nov, 08:00" for a resume time sent by the server. */
export function resumeAtLabel(iso: string): string {
  return `on ${LABEL.format(new Date(iso))}`;
}

export function ResumeAtField({
  id,
  value,
  onChange,
  className,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  // The allowed range is fixed when the field appears; the server checks again on save.
  const [now] = useState(() => Date.now());
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        Resume by itself at (optional)
      </label>
      <input
        id={id}
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={toLocalInput(new Date(now + 5 * 60_000))}
        max={toLocalInput(new Date(now + MAX_DAYS * 24 * 3600_000))}
        className={className}
      />
      <p className="text-xs text-muted-foreground">Leave empty to resume it by hand. Up to {MAX_DAYS} days ahead.</p>
    </div>
  );
}
