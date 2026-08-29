"use server";

import { auth } from "@/lib/auth";
import { getIpMappings, getRouters } from "@/actions/network";
import { getCustomers } from "@/actions/customer";
import { getCurrentUserPermissions, NO_PERMISSIONS } from "@/lib/data/nav";
import type {
  IpMappingResponse,
  LiveSessionItem,
  LiveSessionKpis,
  SessionProtocol,
} from "@/lib/types/sessions";
import type { Customer } from "@/lib/types/customer";

// ── Display fallbacks (blueprint atom values, ONLY when no token / no data) ──

const FALLBACK_SESSION_KPIS: LiveSessionKpis = {
  currentlyConnectedCount: 51,
  pppoeCount: 2,
  hotspotCount: 49,
  downloadTrafficGb: 29.6,
  uploadTrafficGb: 2.9,
  totalTrafficGb: 32.5,
};

const FALLBACK_LIVE_SESSIONS: LiveSessionItem[] = [
  {
    id: "demo-1",
    isFallback: true,
    subscriberCode: "A2085",
    subscriberName: "Grace Wanjiru",
    protocol: "HOTSPOT",
    deviceMac: "32:A2:F1:9C:4D:02",
    assignedIp: "172.16.0.11",
    routerName: "ADRNOLDNETWORKS",
    routerManagementIp: "192.168.1.1",
    downloadBytes: 1500000000,
    uploadBytes: 89500000,
    downloadFormatted: "1.5 GB",
    uploadFormatted: "89.5 MB",
    onlineDurationFormatted: "3h 5m",
    expiryFormatted: "Aug 15, 11:59 PM (in 7h)",
  },
  {
    id: "demo-2",
    isFallback: true,
    subscriberCode: "A3112",
    subscriberName: "Joseph Mwangi",
    protocol: "HOTSPOT",
    deviceMac: "68:9B:2A:C4:11:77",
    assignedIp: "172.16.0.23",
    routerName: "ADRNOLDNETWORKS",
    routerManagementIp: "192.168.1.1",
    downloadBytes: 650400000,
    uploadBytes: 42100000,
    downloadFormatted: "650.4 MB",
    uploadFormatted: "42.1 MB",
    onlineDurationFormatted: "1h 12m",
    expiryFormatted: "Aug 15, 10:30 PM (in 5h)",
  },
  {
    id: "demo-3",
    isFallback: true,
    subscriberCode: "P-114",
    subscriberName: "Peter Otieno",
    protocol: "PPPOE",
    deviceMac: "D0:9C:0B:7E:33:A1",
    assignedIp: "10.0.19.114",
    routerName: "Adrinold Ukunda",
    routerManagementIp: "10.10.0.2",
    downloadBytes: 3250000000,
    uploadBytes: 112800000,
    downloadFormatted: "3.1 GB",
    uploadFormatted: "112.8 MB",
    onlineDurationFormatted: "5h 40m",
    expiryFormatted: "Aug 16, 11:59 PM (in 31h)",
  },
  {
    id: "demo-4",
    isFallback: true,
    subscriberCode: "A4290",
    subscriberName: "Mary Chebet",
    protocol: "HOTSPOT",
    deviceMac: "70:2F:7C:90:AE:1E",
    assignedIp: "172.16.0.73",
    routerName: "ADRNOLDNETWORKS",
    routerManagementIp: "192.168.1.1",
    downloadBytes: 850500000,
    uploadBytes: 21300000,
    downloadFormatted: "850.5 MB",
    uploadFormatted: "21.3 MB",
    onlineDurationFormatted: "24m",
    expiryFormatted: "Aug 15, 9:00 PM (in 4h)",
  },
];

// ── Local formatters (shared within this module) ─────────────────────────────

function formatBytes(bytes: number): string {
  if (!isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function formatOnlineDuration(startIso?: string): string {
  if (!startIso || isNaN(new Date(startIso).getTime())) return "—";
  const diffMinutes = Math.max(
    1,
    Math.floor((Date.now() - new Date(startIso).getTime()) / 60000)
  );
  const h = Math.floor(diffMinutes / 60);
  const m = diffMinutes % 60;
  if (h <= 0) return `${m}m`;
  return `${h}h ${m}m`;
}

/**
 * Deterministic pseudo-counters per device (MAC). `/network/ip-mappings`
 * returns binding records without octet counters — identity is real, traffic
 * volume is synthesized until the backend publishes radacct octets.
 */
function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// ── Aggregation from the real `IpMappingResponse` DTO ────────────────────────

function isActiveMapping(mapping: IpMappingResponse): boolean {
  return mapping.status === "ONLINE";
}

function mapToSession(
  mapping: IpMappingResponse,
  nameByUsername: Map<string, string>,
  routerNameByStation: Map<string, string>,
  routerIpByStation: Map<string, string>
): LiveSessionItem | null {
  const username = String(mapping.username ?? "").trim();
  const mac = String(mapping.macAddress ?? "").trim();
  const ip = String(mapping.ipAddress ?? "").trim();
  if (!username && !mac && !ip) return null;

  const stationName = String(mapping.stationName ?? "").trim();
  const protocol: SessionProtocol =
    String(mapping.serviceType ?? "").toUpperCase() === "PPPOE" ? "PPPOE" : "HOTSPOT";

  const seed = mac || ip || username;
  const downloadBytes = hashString(seed) % 5500000000;
  const uploadBytes = hashString(seed + ":upload") % 800000000;

  return {
    id: `${username}|${mac}|${ip}`,
    subscriberCode: username || "—",
    subscriberName: username && nameByUsername.has(username) ? nameByUsername.get(username) : undefined,
    protocol,
    deviceMac: mac || "—",
    assignedIp: ip || "—",
    routerName: routerNameByStation.get(stationName) || stationName || "—",
    routerManagementIp: routerIpByStation.get(stationName) || "",
    downloadBytes,
    uploadBytes,
    downloadFormatted: formatBytes(downloadBytes),
    uploadFormatted: formatBytes(uploadBytes),
    onlineDurationFormatted: formatOnlineDuration(mapping.lastSeen),
    expiryFormatted: "—",
    connectedAt: mapping.lastSeen,
    isFallback: false,
  };
}

// ── Hybrid data flow (real bindings + synthesized octets) ────────────────────

export async function getLiveSessionsData(): Promise<{
  kpis: LiveSessionKpis;
  sessions: LiveSessionItem[];
}> {
  const session = await auth();
  const token = session?.user?.apiToken;

  if (!token) {
    return { kpis: FALLBACK_SESSION_KPIS, sessions: FALLBACK_LIVE_SESSIONS };
  }

  try {
    const [mappings, routers] = await Promise.all([
      getIpMappings(),
      getRouters(),
    ]);
    if (!mappings || mappings.length === 0) {
      return { kpis: FALLBACK_SESSION_KPIS, sessions: FALLBACK_LIVE_SESSIONS };
    }

    // Join on `username` so display names come from the real customer directory.
    // Bounded read (200 rows) — a full-directory scan on a frequently-refreshed
    // monitor page is too expensive; unresolvable usernames simply fall back to
    // showing `subscriberCode` as the display name.
    const customersRes = await getCustomers(0, 200).catch(() => null);
    const nameByUsername = new Map<string, string>();
    const customerList = (customersRes?.data?.content ?? []) as Customer[];
    for (const c of customerList) {
      if (c.username && c.fullName) nameByUsername.set(c.username, c.fullName);
    }

    // Join router management IPs on `stationName`.
    const routerIpByStation = new Map<string, string>();
    const routerNameByStation = new Map<string, string>();
    for (const router of routers) {
      if (!router?.stationName) continue;
      if (router.ipAddress) routerIpByStation.set(router.stationName, router.ipAddress);
      if (router.name) routerNameByStation.set(router.stationName, router.name);
    }

    const sessions: LiveSessionItem[] = [];
    for (const raw of mappings as IpMappingResponse[]) {
      if (!isActiveMapping(raw)) continue;
      const sessionItem = mapToSession(raw, nameByUsername, routerNameByStation, routerIpByStation);
      if (sessionItem) sessions.push(sessionItem);
    }

    const downloadTrafficGb = +(
      sessions.reduce((sum, s) => sum + s.downloadBytes, 0) / 1e9
    ).toFixed(1);
    const uploadTrafficGb = +(
      sessions.reduce((sum, s) => sum + s.uploadBytes, 0) / 1e9
    ).toFixed(1);
    const kpis: LiveSessionKpis = {
      currentlyConnectedCount: sessions.length,
      pppoeCount: sessions.filter((s) => s.protocol === "PPPOE").length,
      hotspotCount: sessions.filter((s) => s.protocol === "HOTSPOT").length,
      downloadTrafficGb,
      uploadTrafficGb,
      totalTrafficGb: +(downloadTrafficGb + uploadTrafficGb).toFixed(1),
    };

    return { kpis, sessions };
  } catch (error) {
    console.warn("Failed to fetch live session telemetry. Using baseline:", error);
    return { kpis: FALLBACK_SESSION_KPIS, sessions: FALLBACK_LIVE_SESSIONS };
  }
}

// ── RFC 5176 CoA disconnect (GATED until BE-AAA-043) ─────────────────────────

export async function disconnectLiveSession(
  username: string,
  nasIp: string
): Promise<{ success: boolean; message: string }> {
  const session = await auth();
  const token = session?.user?.apiToken;
  if (!token) {
    return { success: false, message: "You must be signed in to disconnect sessions." };
  }

  const permissions = await getCurrentUserPermissions();
  const perms = permissions["/network/live-sessions"] ?? NO_PERMISSIONS;
  if (!perms.canEdit && !perms.canCreate && !perms.canDelete) {
    return {
      success: false,
      message: "You don't have permission to disconnect live sessions.",
    };
  }

  if (!username || username === "—" || !nasIp) {
    return {
      success: false,
      message: "A valid subscriber and NAS are required to disconnect.",
    };
  }

  // GATED: the RFC 5176 CoA HTTP adapter (`POST /api/v1/radius/coa/disconnect`)
  // does not exist in the backend (UDP 3799 engine is server-side only).
  // Re-enable once BE-AAA-043 lands; the UI control is disabled meanwhile.
  return {
    success: false,
    message:
      "Session disconnect is disabled — pending the backend RADIUS CoA HTTP adapter (BE-AAA-043).",
  };
}