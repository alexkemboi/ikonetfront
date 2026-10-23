import type { UplinkCheck, UplinkStatus } from "@/lib/types/uplink";

export const UPLINK_LABEL: Record<UplinkStatus, string> = {
  UP: "Internet up",
  SLOW: "Internet slow",
  DEGRADED: "Internet poor",
  TUNNEL_FAULT: "Management lost",
  DOWN: "No contact",
  UNKNOWN: "Not checked",
};

export const UPLINK_TONE: Record<UplinkStatus, string> = {
  UP: "text-emerald-600 dark:text-emerald-400",
  SLOW: "font-semibold text-amber-600 dark:text-amber-400",
  DEGRADED: "font-semibold text-red-600 dark:text-red-400",
  TUNNEL_FAULT: "font-semibold text-amber-600 dark:text-amber-400",
  DOWN: "font-semibold text-red-600 dark:text-red-400",
  UNKNOWN: "text-muted-foreground",
};

/** "40 s", "12 min", "11 h 49 min", "3 days"; "never" for null. */
export function ageText(seconds: number | null | undefined): string {
  if (seconds == null) return "never";
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 120) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours} h ${minutes % 60} min`;
  return `${Math.floor(hours / 24)} days`;
}

/** Bits per second as "0.06 Mbps", "4.8 Mbps"; "—" when unknown. */
export function mbps(bps: number | null | undefined): string {
  if (bps == null) return "—";
  const value = bps / 1_000_000;
  return `${value < 1 ? value.toFixed(2) : value.toFixed(1)} Mbps`;
}

/** The router's own view in a few words: "3% loss · 52 ms", "every ping lost", "not checked". */
export function pingText(c: Pick<UplinkCheck, "pingLossPct" | "pingAvgMs">): string {
  if (c.pingLossPct == null) return "not checked";
  if (c.pingLossPct >= 100) return "every ping lost";
  return c.pingAvgMs == null ? `${c.pingLossPct}% loss` : `${c.pingLossPct}% loss · ${c.pingAvgMs} ms`;
}

/**
 * The router's pings over the verdict's window: "15 min: 6% loss · 98 ms (quiet 24 ms)"; null when
 * the check has no window (the tunnel was down, or it was stored before windows existed).
 */
export function windowText(c: Pick<UplinkCheck, "windowLossPct" | "windowAvgMs" | "baselineMs">): string | null {
  if (c.windowLossPct == null) return null;
  const avg = c.windowAvgMs == null ? "" : ` · ${c.windowAvgMs} ms`;
  const quiet = c.baselineMs == null ? "" : ` (quiet ${c.baselineMs} ms)`;
  return `15 min: ${c.windowLossPct}% loss${avg}${quiet}`;
}

/** Routers whose customers are likely affected now: no contact or poor internet. */
export function uplinkProblems(checks: UplinkCheck[]): UplinkCheck[] {
  return checks.filter((c) => c.status === "DOWN" || c.status === "DEGRADED");
}
