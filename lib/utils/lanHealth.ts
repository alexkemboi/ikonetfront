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

/** Routers where another DHCP server is answering customers: the alarm. */
export function routersWithDhcpAlarm(routers: RouterLanHealth[]): RouterLanHealth[] {
  return routers.filter((r) => r.status !== "UNKNOWN" && (r.unauthorisedDhcpServers ?? 0) > 0);
}

/** Routers where devices hold a wrong address although no DHCP server was caught. */
export function routersWithWrongAddresses(routers: RouterLanHealth[]): RouterLanHealth[] {
  return routers.filter(
    (r) => r.status !== "UNKNOWN" && (r.unauthorisedDhcpServers ?? 0) === 0 && (r.devicesOnWrongAddress ?? 0) > 0
  );
}

/** One plain sentence for what is wrong on a router, or null when nothing is. */
export function lanProblemSentence(r: RouterLanHealth): string | null {
  const servers = r.unauthorisedDhcpServers ?? 0;
  const wrong = r.devicesOnWrongAddress ?? 0;
  if (r.status === "UNKNOWN") return null;
  if (servers > 0) {
    return `${servers} ${servers === 1 ? "device is" : "devices are"} handing out addresses that only the router should give` +
      (wrong > 0 ? `, and ${wrong} customer ${wrong === 1 ? "device has" : "devices have"} a wrong address` : "") + ".";
  }
  if (wrong > 0) {
    return `${wrong} customer ${wrong === 1 ? "device has" : "devices have"} an address the router did not give out.`;
  }
  if (r.accessPointsNotSeen > 0) {
    return `${r.accessPointsNotSeen} access ${r.accessPointsNotSeen === 1 ? "point has" : "points have"} not been seen for over ${r.notSeenAfterMinutes} minutes.`;
  }
  return null;
}
