"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { apiFetch } from "@/lib/apiClient";
import { BASE_URL, buildApiUrl } from "@/lib/constants";
import {
  NasRouterItem,
  NasRouterKpis,
  ProvisioningScriptResponse,
  RouterServicesConfigRequest,
} from "@/lib/types/provisioning";
import { getMikrotikDeviceStatus } from "@/actions/mikrotik";
import { getPermissionForRoute } from "@/lib/data/nav";

type NasRouterApiResponse = {
  kpis: {
    totalCount: number;
    onlineCount: number;
    offlineCount: number;
    activeSessionsTotal: number;
    healthyCount: number;
    degradedCount: number;
    notProvisionedCount: number;
    cpuAvg: number | null;
    memoryAvg: number | null;
    rowsWithTelemetry: number;
  };
  rows: Array<{
    routerId: number | null;
    deviceId: number | null;
    name: string;
    model: string | null;
    serialNumber: string | null;
    status: "ONLINE" | "OFFLINE" | "DEGRADED" | "NOT_PROVISIONED";
    online: boolean;
    managementIp: string | null;
    winboxTunnelAddress: string | null;
    winboxTunnelPort: number | null;
    activeSessions: number | null;
    cpuUsage: number | null;
    freeMemory: number | null;
    totalMemory: number | null;
    uptime: string | null;
    snapshotAt: string | null;
    telemetryStatus: "LIVE" | "STALE" | "UNAVAILABLE";
    companyCode: string | null;
    stationName: string | null;
    links: NonNullable<NasRouterItem["links"]>;
  }>;
};

async function getAuthHeaders(): Promise<HeadersInit> {
  const session = await auth();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (session?.user?.apiToken) {
    (headers as Record<string, string>)["Authorization"] =
      `Bearer ${session.user.apiToken}`;
  }
  return headers;
}

export type NasRouterLoadResult =
  | { success: true; kpis: NasRouterKpis; routers: NasRouterItem[] }
  | { success: false; message: string; requestId?: string };

export async function getNasRoutersData(): Promise<NasRouterLoadResult> {
  const requestId = crypto.randomUUID();
  try {
    const res = await apiFetch<NasRouterApiResponse>("/provisioning/nas-routers", {
      auth: "required",
      cache: "no-store",
      tags: ["nas-routers"],
      headers: { "X-Request-Id": requestId },
    });
    if (!res.success || !res.data) return { success: false, message: res.message, requestId: res.requestId };
    const routers: NasRouterItem[] = res.data.rows.map((row) => ({
      routerId: row.routerId ?? undefined,
      deviceId: row.deviceId ?? undefined,
      serialNumber: row.serialNumber,
      name: row.name,
      model: row.model ?? "—",
      status: row.status,
      online: row.online,
      activeSessions: row.activeSessions,
      managementIp: row.managementIp ?? "—",
      lastOnlineText: row.uptime ?? "—",
      winboxTunnelAddress: row.winboxTunnelAddress,
      winboxTunnelPort: row.winboxTunnelPort,
      cpuUsage: row.cpuUsage,
      freeMemory: row.freeMemory,
      totalMemory: row.totalMemory,
      uptime: row.uptime,
      snapshotAt: row.snapshotAt,
      telemetryStatus: row.telemetryStatus,
      companyCode: row.companyCode,
      stationName: row.stationName,
      links: row.links,
    }));
    return {
      success: true,
      kpis: {
        totalRoutersCount: res.data.kpis.totalCount,
        onlineCount: res.data.kpis.onlineCount,
        offlineCount: res.data.kpis.offlineCount,
        liveSessionsCount: res.data.kpis.activeSessionsTotal,
        healthyCount: res.data.kpis.healthyCount,
        degradedCount: res.data.kpis.degradedCount,
        notProvisionedCount: res.data.kpis.notProvisionedCount,
        cpuAvg: res.data.kpis.cpuAvg,
        memoryAvg: res.data.kpis.memoryAvg,
        rowsWithTelemetry: res.data.kpis.rowsWithTelemetry,
      },
      routers,
    };
  } catch {
    console.error("Error fetching NAS routers.");
    return { success: false, message: "DATA_SOURCE_UNAVAILABLE", requestId };
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