"use server";

import { withCompanyContext } from "@/lib/companyContext";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { BASE_URL, buildApiUrl } from "@/lib/constants";
import type { RouterHealthSnapshot, RouterResponse } from "@/lib/types/network";
import { getRouters, getRouterMonitoringLatest } from "@/actions/network";
import { isRouterOnline } from "@/lib/utils/router-status";
import {
  NasRouterItem,
  NasRouterKpis,
  ProvisioningScriptResponse,
  RouterServicesConfigRequest,
} from "@/lib/types/provisioning";
import { getMikrotikDeviceStatus, getMikrotikDevices } from "@/actions/mikrotik";
import { getPermissionForRoute } from "@/lib/data/nav";

async function getAuthHeaders(): Promise<HeadersInit> {
  const session = await auth();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (session?.user?.apiToken) {
    (headers as Record<string, string>)["Authorization"] =
      `Bearer ${session.user.apiToken}`;
  }
  // Forward the SYSADMIN-selected company so the backend scopes the call.
  return withCompanyContext(headers as Record<string, string>);
}

function mapDeviceToNasRouter(device: {
  id: number;
  name: string;
  deviceType?: string | null;
  online?: boolean;
  ipAddress?: string;
  uptime?: string | null;
  cpuLoad?: string | null;
  winboxTunnelPort?: number | null;
  webfigProxyEnabled?: boolean | null;
  tunnelExpiresAt?: string | null;
  winboxTunnelAddress?: string | null;
  webConsoleUrl?: string | null;
}, routerIdxno?: number): NasRouterItem {
  return {
    // id/name/status/managementIp come from the real network-devices row;
    // activeSessions fills from telemetry, winbox/webfig from the real tunnel
    // lease (Track 1) instead of a synthesized mock.
    id: String(device.id),
    deviceId: device.id,
    routerId: routerIdxno,
    name: device.name,
    model: device.deviceType ?? "—",
    status: device.online ? "ONLINE" : "OFFLINE",
    online: device.online ?? false,
    activeSessions: 0,
    winboxTunnelAddress: device.winboxTunnelAddress ?? null,
    winboxTunnelPort: device.winboxTunnelPort ?? null,
    webConsoleUrl: device.webConsoleUrl ?? null,
    tunnelExpiresAt: device.tunnelExpiresAt ?? null,
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
  // A fresh telemetry snapshot is authoritative proof the router is reachable —
  // the device.online flag (set by the ARP discovery scheduler) can lag behind
  // the telemetry worker, which is what caused "live RAM/uptime next to an
  // Offline badge". Elevate status when the snapshot is recent (< 5 min old).
  let status = row.status;
  let snapshotAt = null;
  try {
    const ts = new Date(snapshot.createdAt ?? snapshot.idxno).getTime();
    if (Number.isFinite(ts)) {
      snapshotAt = new Date(ts).toISOString();
      if (Date.now() - ts < 5 * 60 * 1000) {
        status = "ONLINE";
      }
    }
  } catch {
    // unparseable timestamp — keep the device-row derived status
  }
  return {
    ...row,
    status,
    snapshotAt,
    cpuUsage: snapshot.cpuUsage ?? row.cpuUsage,
    freeMemory: snapshot.freeMemory ?? row.freeMemory,
    totalMemory: snapshot.totalMemory ?? row.totalMemory,
    uptime: snapshot.uptime ?? row.uptime,
    activeSessions:
      snapshot.activePppoeSessions + snapshot.activeHotspotSessions || row.activeSessions,
  };
}

function deriveNasKpis(routers: NasRouterItem[]): NasRouterKpis {
  const online = routers.filter(isRouterOnline).length;
  const live = routers.reduce((sum, r) => sum + (r.activeSessions ?? 0), 0);
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
  /** Set when the inventory could not be loaded (distinct from "no routers"). */
  error?: string;
}> {
  try {
    const res = await getMikrotikDevices();
    if (!res.success || !Array.isArray(res.data)) {
      return {
        kpis: deriveNasKpis([]),
        routers: [],
        error: res.message || "Could not load the router inventory.",
      };
    }
    if (res.data.length === 0) {
      // A company with no routers yet is a real, empty state — never sample data.
      return { kpis: deriveNasKpis([]), routers: [] };
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
        // Telemetry snapshots store routerId = network_routers.idxno; without a
        // matching router row there is no telemetry for this device.
        if (!routerIdxno) return base;
        const snapshot = await getRouterMonitoringLatest(routerIdxno).catch(() => null);
        return enrichWithLatestSnapshot(base, snapshot);
      })
    );

    return { kpis: deriveNasKpis(routers), routers };
  } catch (error: unknown) {
    console.error("Error fetching NAS routers:", error);
    return {
      kpis: deriveNasKpis([]),
      routers: [],
      error: "Could not load the router inventory.",
    };
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