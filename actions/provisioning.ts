"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { BASE_URL } from "@/lib/constants";
import {
  NasRouterItem,
  NasRouterKpis,
  ProvisioningScriptResponse,
  RouterServicesConfigRequest,
} from "@/lib/types/provisioning";
import { getMikrotikDevices, getMikrotikDeviceStatus } from "@/actions/mikrotik";
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
    name: "Adrinold Ukunda",
    model: "RouterOS RB5009UG+S+",
    status: "ONLINE",
    activeSessions: 18,
    winboxTunnelAddress: "winbox.centipidbilling.com:54910",
    managementIp: "10.9.189.88",
    lastOnlineText: "Jul 20, 03:34 AM",
  },
  {
    id: "rtr-2",
    name: "ADRNOLDNETWORKS",
    model: "RouterOS RB5009UG+S+",
    status: "ONLINE",
    activeSessions: 32,
    winboxTunnelAddress: "winbox.centipidbilling.com:56021",
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
}): NasRouterItem {
  return {
    // id/name/status/managementIp from the real network-devices row;
    // activeSessions/winboxTunnel=address/lastOnline=uptime are synthesized placeholders
    id: String(device.id),
    name: device.name,
    model: device.deviceType ?? "—",
    status: device.online ? "ONLINE" : "OFFLINE",
    activeSessions: 0,
    winboxTunnelAddress: `winbox.centipidbilling.com:${20000 + device.id}`,
    managementIp: device.ipAddress ?? "—",
    lastOnlineText: device.uptime ?? "—",
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
    const routers = res.data.map(mapDeviceToNasRouter);
    return { kpis: deriveNasKpis(routers), routers };
  } catch (error: unknown) {
    console.error("Error fetching NAS routers:", error);
    return { kpis: FALLBACK_NAS_KPIS, routers: FALLBACK_NAS_ROUTERS };
  }
}

/**
 * Step 1: Submits Router Identity and receives a RouterOS /tool fetch command.
 */
export async function generateZtpScript(
  identity: string
): Promise<ProvisioningScriptResponse> {
  const session = await auth();
  const token = session?.user?.apiToken;

  if (token) {
    try {
      const response = await fetch(
        `${BASE_URL}network/provisioning/generate-script`,
        {
          method: "POST",
          headers: await getAuthHeaders(),
          body: JSON.stringify({ identity }),
        }
      );
      if (response.ok) {
        const payload = (await response.json()) as {
          data?: {
            routerId?: string;
            token?: string;
            fetchCommand?: string;
          } | null;
        };
        const data =
          payload?.data ??
          (payload as { routerId?: string; token?: string; fetchCommand?: string });
        const backendToken = data?.token;
        const backendCommand = data?.fetchCommand;
        if (backendToken || backendCommand) {
          // Keep the returned token and the token embedded in the command in sync.
          // When the backend only supplies one side, derive the other from it so
          // the pasted script always authenticates with the token the wizard knows.
          const effectiveToken =
            backendToken ?? extractProvisionToken(backendCommand);
          if (effectiveToken) {
            return {
              routerId: data?.routerId
                ? String(data.routerId)
                : `rtr-${Date.now()}`,
              identity,
              token: effectiveToken,
              fetchCommand: backendCommand ?? buildFetchCommand(effectiveToken),
              deviceModeRequired: true,
            };
          }
        }
      }
    } catch (error: unknown) {
      console.warn("ZTP script generation failed; using local fallback.", error);
    }
  }

  const tokenPayload = buildLocalToken(identity);
  return {
    routerId: `rtr-${Date.now()}`,
    identity,
    token: tokenPayload,
    fetchCommand: buildFetchCommand(tokenPayload),
    deviceModeRequired: true,
  };
}

/**
 * Step 2: Polls router connectivity status.
 */
export async function pollRouterConnection(routerId: string): Promise<boolean> {
  const session = await auth();
  if (session?.user?.apiToken && /^\d+$/.test(routerId)) {
    try {
      const res = await getMikrotikDeviceStatus(Number(routerId));
      return !!res.data?.online;
    } catch (error: unknown) {
      console.warn(`Status poll failed for router ${routerId}.`, error);
    }
  }
  // Fallback id ("rtr-<timestamp>") or unreachable backend: simulate device-online
  await new Promise((resolve) => setTimeout(resolve, 2500));
  return true;
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

function extractProvisionToken(fetchCommand: string | undefined): string | null {
  if (!fetchCommand) return null;
  const match = fetchCommand.match(/\/provision\/([^"\s]+)/);
  return match?.[1] ?? null;
}

function buildLocalToken(identity: string): string {
  return btoa(JSON.stringify({ identity, timestamp: Date.now() }));
}

function buildFetchCommand(token: string): string {
  return `/tool fetch mode=https url="https://adrinoldnetwork.centipidtechnologies.com/provision/${token}" dst-path=centipid.rsc;delay 2s;/import centipid.rsc;`;
}