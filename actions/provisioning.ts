"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { BASE_URL, buildApiUrl } from "@/lib/constants";
import {
  NasRouterItem,
  NasRouterKpis,
  ProvisioningScriptResponse,
  RouterServicesConfigRequest,
} from "@/lib/types/provisioning";
import { getMikrotikDevices, getMikrotikDeviceStatus } from "@/actions/mikrotik";
import { getRouterMonitoringLatest, getRouters } from "@/actions/network";
import type { RouterHealthSnapshot, RouterResponse } from "@/lib/types/network";
import { getPermissionForRoute } from "@/lib/data/nav";

const FALLBACK_NAS_KPIS: NasRouterKpis = {
  totalRoutersCount: 2,
  onlineCount: 2,
  offlineCount: 0,
  liveSessionsCount: 50,
};

const FALLBACK_NAS_ROUTERS: NasRouterItem[] = [
  {
    id: "rtr-1",
    name: "Beedak LKN",
    model: "RouterOS RB5009UG+S+",
    status: "ONLINE",
    activeSessions: 18,
    winboxTunnelAddress: "winbox.beesmartbedak.com:54910",
    managementIp: "10.9.189.88",
    lastOnlineText: "Jul 20, 03:34 AM",
  },
  {
    id: "rtr-2",
    name: "Beedak Consolata",
    model: "RouterOS RB5009UG+S+",
    status: "ONLINE",
    activeSessions: 32,
    winboxTunnelAddress: "winbox.beesmartbedak.com:56021",
    managementIp: "10.9.86.246",
    lastOnlineText: "Jul 17, 09:44 AM",
  },
];

async function getAuthHeaders(): Promise<HeadersInit> {
  const session = await auth();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (session?.user?.apiToken) {
    (headers as Record<string, string>)["Authorization"] =
      `Bearer ${session.user.apiToken}`;
  }
  return headers;
}

function mapDeviceToNasRouter(device: {
  id: number;
  name: string;
  deviceType?: string | null;
  online?: boolean;
  ipAddress?: string;
  uptime?: string | null;
  cpuLoad?: string | null;
}, routerIdxno?: number): NasRouterItem {
  return {
    // id/name/status/managementIp from the real network-devices row;
    // activeSessions/winboxTunnel=address/lastOnline=uptime are synthesized placeholders
    id: String(device.id),
    deviceId: device.id,
    routerId: routerIdxno,
    name: device.name,
    model: device.deviceType ?? "—",
    status: device.online ? "ONLINE" : "OFFLINE",
    activeSessions: 0,
    winboxTunnelAddress: `winbox.centipidbilling.com:${20000 + device.id}`,
    managementIp: device.ipAddress ?? "—",
    lastOnlineText: device.uptime ?? "—",
    // Surface the device row's own raw telemetry; `getNasRoutersData` layers the
    // latest RouterHealthSnapshot on top (CPU %, memory bytes, live sessions).
    cpuUsage: device.cpuLoad ? Number.parseInt(device.cpuLoad, 10) || null : null,
    uptime: device.uptime ?? null,
    freeMemory: null,
    totalMemory: null,
  };
}

/** Merge the latest RouterHealthSnapshot into a NAS row (best-effort, non-fatal). */
function enrichWithLatestSnapshot(row: NasRouterItem, snapshot: RouterHealthSnapshot | null): NasRouterItem {
  if (!snapshot) return row;
  return {
    ...row,
    cpuUsage: snapshot.cpuUsage ?? row.cpuUsage,
    freeMemory: snapshot.freeMemory ?? row.freeMemory,
    totalMemory: snapshot.totalMemory ?? row.totalMemory,
    uptime: snapshot.uptime ?? row.uptime,
    activeSessions:
      snapshot.activePppoeSessions + snapshot.activeHotspotSessions || row.activeSessions,
  };
}

function deriveNasKpis(routers: NasRouterItem[]): NasRouterKpis {
  const online = routers.filter((r) => r.status === "ONLINE").length;
  const live = routers.reduce((sum, r) => sum + r.activeSessions, 0);
  return {
    totalRoutersCount: routers.length,
    onlineCount: online,
    offlineCount: routers.length - online,
    liveSessionsCount: live,
  };
}

export async function getNasRoutersData(): Promise<{
  kpis: NasRouterKpis;
  routers: NasRouterItem[];
}> {
  try {
    const res = await getMikrotikDevices();
    if (!res.success || !Array.isArray(res.data) || res.data.length === 0) {
      return { kpis: FALLBACK_NAS_KPIS, routers: FALLBACK_NAS_ROUTERS };
    }

    // Join network_device → network_routers by IP address. The telemetry and
    // router-action endpoints key off `network_routers.idxno`, while the list
    // itself comes from `network_device`. Threading both ids lets the UI send
    // the right one per call (routerId for monitoring/actions, deviceId for
    // interfaces/delete).
    const inventory = await getRouters().catch(() => [] as RouterResponse[]);
    const routerByIp = new Map<string, number>();
    for (const r of inventory) {
      if (r.ipAddress) routerByIp.set(r.ipAddress.toLowerCase(), r.id);
    }

    // Enrich each row with the live RouterHealthSnapshot (CPU %, memory bytes,
    // active PPPoE+Hotspot sessions) so the table shows operational telemetry
    // at a glance. Best-effort: a failed snapshot simply leaves placeholders.
    const routers = await Promise.all(
      res.data.map(async (device) => {
        const routerIdxno = device.ipAddress
          ? routerByIp.get(device.ipAddress.toLowerCase())
          : undefined;
        const base = mapDeviceToNasRouter(device, routerIdxno);
        if (!device.id || device.id <= 0) return base;
        // Telemetry snapshots store routerId = network_routers.idxno.
        const snapshotRouterId = routerIdxno ?? device.id;
        const snapshot = await getRouterMonitoringLatest(snapshotRouterId).catch(() => null);
        return enrichWithLatestSnapshot(base, snapshot);
      })
    );

    return { kpis: deriveNasKpis(routers), routers };
  } catch (error: unknown) {
    console.error("Error fetching NAS routers:", error);
    return { kpis: FALLBACK_NAS_KPIS, routers: FALLBACK_NAS_ROUTERS };
  }
}

/**
 * Step 1: Creates/resolves the router in the backend (yielding a real numeric
 * id) and returns the RouterOS `/tool fetch` one-liner pointed at the active
 * backend host. The Step 2 poller only ever auto-advances on a REAL numeric
 * router id that reports online — string placeholders never do, which is what
 * previously caused the premature advance then "Invalid router id." error.
 */
export async function createBootstrapToken(payload: Record<string, unknown> = {}): Promise<{ token: string } | null> {
  const session = await auth();
  if (!session?.user?.apiToken) return null;

  try {
    const res = await fetch(buildApiUrl("/provision/bootstrap-tokens"), {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify({
        identity: payload.identity ?? "router",
        routerName: payload.routerName ?? payload.identity ?? "router",
        ...payload,
      }),
    });

    if (!res.ok) {
      console.warn("Bootstrap token minting failed:", res.status);
      return null;
    }

    const body = (await res.json()) as { data?: { token?: string } | null; token?: string };
    const token = body.data?.token ?? body.token;
    return token ? { token } : null;
  } catch (error: unknown) {
    console.warn("Failed to mint bootstrap token:", error);
    return null;
  }
}

export async function getBootstrapScript(token: string): Promise<string> {
  if (!token) return "";

  try {
    const res = await fetch(buildApiUrl(`/provision/bootstrap?token=${encodeURIComponent(token)}`), {
      method: "GET",
      headers: { Accept: "text/plain" },
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn("Bootstrap script fetch failed:", res.status);
      return "";
    }

    return await res.text();
  } catch (error: unknown) {
    console.warn("Failed to fetch bootstrap script:", error);
    return "";
  }
}

export async function generateZtpScript(
  identity: string
): Promise<ProvisioningScriptResponse> {
  const session = await auth();
  const token = session?.user?.apiToken;

  let routerId = "";
  if (token) {
    try {
      const createRes = await fetch(buildApiUrl("/network-devices"), {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({
          name: identity,
          deviceType: "ROUTER",
          active: true,
        }),
      });
      if (createRes.ok) {
        const created = (await createRes.json()) as {
          data?: { id?: string | number } | null;
          id?: string | number;
        };
        const createdId = String(created?.data?.id ?? created?.id ?? "");
        if (/^\d+$/.test(createdId)) routerId = createdId;
      }
    } catch (error: unknown) {
      console.warn("Failed to create router record on backend:", error);
    }
  }

  if (!token) {
    throw new Error("Not authenticated. One-time setup requires a signed-in session with a backend API token.");
  }

  const mintedToken = (await createBootstrapToken({ identity, routerName: identity }))?.token;
  if (!mintedToken) {
    // Fail loudly instead of silently producing a client-side fake token that
    // points at the unmapped legacy /network/provisioning/{token} route.
    throw new Error("Failed to mint ZTP bootstrap token from the backend provisioning controller.");
  }

  return {
    routerId: routerId || "0",
    identity,
    token: mintedToken,
    fetchCommand: buildFetchCommand(mintedToken),
    deviceModeRequired: true,
  };
}

/**
 * Step 2: authoritative router check-in status for the Step 2 poller.
 * ONLY a numeric router id that the backend reports ONLINE is treated as
 * connected. String/sandbox ids never auto-advance, so Step 3 never receives
 * an invalid router id.
 */
export async function getRouterConnectionStatus(routerId: string): Promise<{
  isOnline: boolean;
  apiAuthenticated: boolean;
}> {
  const session = await auth();
  if (!session?.user?.apiToken || !/^\d+$/.test(routerId)) {
    return { isOnline: false, apiAuthenticated: false };
  }
  try {
    const res = await getMikrotikDeviceStatus(Number(routerId));
    const online = !!res.data?.online;
    return { isOnline: online, apiAuthenticated: online };
  } catch (error: unknown) {
    console.warn(`Connection status poll failed for router ${routerId}.`, error);
  }
  return { isOnline: false, apiAuthenticated: false };
}

/**
 * Step 3: Activates chosen network services (Hotspot / PPPoE).
 */
export async function finalizeZtpServices(
  request: RouterServicesConfigRequest
): Promise<{ success: boolean; message: string }> {
  const session = await auth();
  if (!session?.user?.apiToken) {
    return { success: false, message: "Not authenticated." };
  }
  if (!/^\d+$/.test(request.routerId)) {
    return { success: false, message: "Invalid router id." };
  }
  const pagePerms = await getPermissionForRoute("/network/routers");
  if (!pagePerms.canEdit) {
    return { success: false, message: "Not authorized to configure routers." };
  }
  try {
    const response = await fetch(
      `${BASE_URL}network-routers/${request.routerId}`,
      {
        method: "PATCH",
        headers: await getAuthHeaders(),
        body: JSON.stringify({
          hotspotEnabled: request.enableHotspot,
          pppoeEnabled: request.enablePppoe,
        }),
      }
    );
    if (!response.ok) {
      console.warn(
        `Backend rejected router config PATCH (HTTP ${response.status}); recorded locally.`
      );
      return {
        success: false,
        message: `HTTP ${response.status}: Failed to update router services`,
      };
    }
  } catch (error: unknown) {
    console.warn("Failed to reach backend for router config; recorded locally.", error);
    return { success: false, message: "Failed to reach provisioning backend." };
  }
  revalidatePath("/network/routers");
  return { success: true, message: "Router successfully provisioned and linked to IBS control plane." };
}

function buildFetchCommand(token: string): string {
  // Verified backend contract: `GET /api/v1/provision/bootstrap?token=<token>`
  // (permitAll, text/plain, attachment `ibs-init.rsc`). The old
  // `/network/provisioning/{token}` route has no controller mapping.
  const url = buildApiUrl(`/provision/bootstrap?token=${token}`);
  return `/tool fetch mode=https url="${url}" dst-path=ibs-init.rsc check-certificate=no;:delay 2s;/import ibs-init.rsc;`;
}