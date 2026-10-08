import type { RouterOutage } from "@/lib/types/network";

/** "45s", "12m", "3h 05m", "2d 4h". */
export function formatOutageDuration(seconds: number): string {
  if (seconds < 60) return `${Math.max(0, Math.round(seconds))}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${String(minutes % 60).padStart(2, "0")}m`;
  return `${Math.floor(hours / 24)}d ${hours % 24}h`;
}

/** Plain-language cause, as shown to operators. */
export function outageCauseLabel(outage: Pick<RouterOutage, "cause" | "status">): string {
  if (outage.cause === "POWER_LOSS") return "Power cut or router restart";
  if (outage.cause === "LINK_LOSS") return "Connection to the router lost (router stayed on)";
  return outage.status === "OPEN"
    ? "Cause known once the router is back"
    : "Cause not known yet";
}

/** What was done about the outage, in plain words. */
export function outageCreditLabel(
  outage: Pick<RouterOutage, "creditStatus" | "creditedSessions" | "creditedMinutes" | "status" | "closedBy">
): string {
  switch (outage.creditStatus) {
    case "APPLIED":
      return outage.creditedSessions === 0
        ? "No hotspot session was running, so nothing to give back"
        : `Time given back to ${outage.creditedSessions} hotspot ${outage.creditedSessions === 1 ? "session" : "sessions"} (${formatOutageDuration(outage.creditedMinutes * 60)} in total)`;
    case "REFUSED":
      return "Credit refused by an administrator";
    case "NOT_ELIGIBLE":
      return outage.closedBy ? `Closed by ${outage.closedBy}; nothing given back` : "Nothing given back";
    default:
      return outage.status === "OPEN"
        ? "Sessions are protected; time is given back if this was a power cut"
        : "Waiting for the cause before giving time back";
  }
}
