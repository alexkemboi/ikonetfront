import type { RouterLanHealth } from "@/lib/types/lanHealth";

/** "just now", "4 min ago", "3h ago", "2 days ago". */
export function timeAgo(iso: string | null | undefined, now: number = Date.now()): string {
  if (!iso) return "never";
  const minutes = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  return hours < 48 ? `${hours}h ago` : `${Math.floor(hours / 24)} days ago`;
}

/** Routers where customer devices hold an address the router did not give out: the alarm. */
export function routersWithCustomersOnWrongAddress(routers: RouterLanHealth[]): RouterLanHealth[] {
  return routers.filter((r) => r.status !== "UNKNOWN" && (r.devicesOnWrongAddress ?? 0) > 0);
}

/**
 * Routers with equipment set up to hand out addresses while no customer holds one: a risk to
 * fix, not an outage. (On ADRINOLD-WESTLANDS on 13-14 Oct 2026 23 such access points were present
 * while customers connected normally.)
 */
export function routersWithDhcpServersOnly(routers: RouterLanHealth[]): RouterLanHealth[] {
  return routers.filter(
    (r) => r.status !== "UNKNOWN" && (r.unauthorisedDhcpServers ?? 0) > 0 && (r.devicesOnWrongAddress ?? 0) === 0
  );
}

/**
 * Routers that cannot sign any customer in: paid customers there stay offline. Includes a
 * router holding an old RADIUS password even before anyone has tried (the server will refuse it).
 */
export function routersThatCannotSignIn(routers: RouterLanHealth[]): RouterLanHealth[] {
  return routers.filter(
    (r) => r.radiusPasswordStatus === "OUT_OF_DATE"
      || (r.status !== "UNKNOWN" && (r.signInStatus === "NOT_WORKING" || r.signInStatus === "NOT_SET_UP"))
  );
}

/** Routers that hold an old RADIUS password: the server refuses every sign-in from them. */
export function routersWithOldPassword(routers: RouterLanHealth[]): RouterLanHealth[] {
  return routers.filter((r) => r.radiusPasswordStatus === "OUT_OF_DATE");
}

/** Short label for the RADIUS password column. */
export function passwordLabel(r: Pick<RouterLanHealth, "radiusPasswordStatus">): string {
  switch (r.radiusPasswordStatus) {
    case "CURRENT":
      return "Current";
    case "OUT_OF_DATE":
      return "Out of date";
    default:
      return "Not recorded";
  }
}

/** "4 h 56 min slow", "7 min fast", "on time". */
export function clockOffsetLabel(seconds: number | null | undefined): string {
  if (seconds == null) return "not read";
  const abs = Math.abs(seconds);
  if (abs < 60) return "on time";
  const hours = Math.floor(abs / 3600);
  const minutes = Math.floor((abs % 3600) / 60);
  return `${hours > 0 ? `${hours} h ${minutes} min` : `${minutes} min`} ${seconds < 0 ? "slow" : "fast"}`;
}

/** Short label for the router clock column. */
export function clockLabel(r: Pick<RouterLanHealth, "clockStatus" | "clockOffsetSeconds">): string {
  switch (r.clockStatus) {
    case "OK":
      return "Right";
    case "WRONG":
      return `Wrong (${clockOffsetLabel(r.clockOffsetSeconds)})`;
    case "NO_TIME_SERVER":
      return "Right, no time server";
    default:
      return "Not read";
  }
}

/** One line on when the check last had to set the clock, or null when it never had to this week. */
export function clockCorrectedSentence(
  r: Pick<RouterLanHealth, "clockCorrectedAt" | "clockCorrectedBySeconds">,
  now: number = Date.now()
): string | null {
  if (!r.clockCorrectedAt) return null;
  return `set ${timeAgo(r.clockCorrectedAt, now)}; it was ${clockOffsetLabel(r.clockCorrectedBySeconds)}`;
}

/** Short label for the sign-in column. */
export function signInLabel(r: Pick<RouterLanHealth, "signInStatus">): string {
  switch (r.signInStatus) {
    case "WORKING":
      return "Working";
    case "NOT_WORKING":
      return "Not working";
    case "NOT_SET_UP":
      return "Not set up";
    case "NO_ATTEMPTS":
      return "No one tried lately";
    default:
      return "Not known yet";
  }
}

/** One plain sentence for a router that cannot sign customers in, or null when it can. */
export function signInProblemSentence(r: RouterLanHealth): string | null {
  if (r.radiusPasswordStatus === "OUT_OF_DATE") {
    return "the router holds an old RADIUS password, so the sign-in server refuses every customer from it.";
  }
  if (r.signInStatus === "NOT_SET_UP") {
    return "the hotspot has no sign-in (RADIUS) server set on the router, so no customer can be signed in.";
  }
  if (r.signInStatus === "NOT_WORKING") {
    return `${r.signInUnanswered} sign-in ${r.signInUnanswered === 1 ? "request" : "requests"} in the last ` +
      `${r.signInWindowMinutes} minutes got no answer and none was answered. Customers who pay here are not connected.`;
  }
  return null;
}

/** One plain sentence for what is wrong on a router, or null when nothing is. */
export function lanProblemSentence(r: RouterLanHealth): string | null {
  const servers = r.unauthorisedDhcpServers ?? 0;
  const wrong = r.devicesOnWrongAddress ?? 0;
  if (r.status === "UNKNOWN") return null;
  const signIn = signInProblemSentence(r);
  if (signIn) return signIn.charAt(0).toUpperCase() + signIn.slice(1);
  if (r.clockStatus === "WRONG") {
    return `The router's clock is ${clockOffsetLabel(r.clockOffsetSeconds)} and could not be set: its customers show as ` +
      `"Paid, not connected" or offline while they are online.`;
  }
  if (wrong > 0) {
    return `${wrong} customer ${wrong === 1 ? "device has" : "devices have"} an address the router did not give out ` +
      `and cannot reach the payment page or the internet` +
      (servers > 0 ? `; ${servers} ${servers === 1 ? "device on the network is" : "devices on the network are"} handing out addresses.` : ".");
  }
  if (servers > 0) {
    return `${servers} ${servers === 1 ? "device is" : "devices are"} set up to hand out addresses, which only the router ` +
      `should do. No customer holds one of their addresses right now.`;
  }
  if (r.accessPointsNotSeen > 0) {
    return `${r.accessPointsNotSeen} access ${r.accessPointsNotSeen === 1 ? "point has" : "points have"} not been seen for over ${r.notSeenAfterMinutes} minutes.`;
  }
  return null;
}
