"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/apiClient";
import type { RouterHealthSnapshot, RouterResponse } from "@/lib/types/network";
import { getRegions, getRouters, getRouterMonitoringLatest } from "@/actions/network";
import { isRouterOnline } from "@/lib/utils/router-status";
import {
  NasRouterItem,
  NasRouterKpis,
  BootstrapTokenResponse,
  ProvisioningStatusResponse,
  ZtpBootstrapInput,
  ZtpProvisioningStatus,
  ZtpScriptResult,
  ZtpStationOption,
} from "@/lib/types/provisioning";
import { validateZtpBootstrapInput } from "@/lib/utils/ztp-validation";
import { getMikrotikDevices } from "@/actions/mikrotik";
import { getPermissionForRoute } from "@/lib/data/nav";

function mapDeviceToNasRouter(device: {
  id: number;
  name: string;
  deviceType?: string | null;
  online?: boolean;
  active?: boolean | null;
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
    // a router with customer history is retired, not deleted: kept for the record, hidden by default
    retired: device.active === false,
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

    // retired routers are not part of the fleet: they never count as offline
    return { kpis: deriveNasKpis(routers.filter((r) => !r.retired)), routers };
  } catch (error: unknown) {
    console.error("Error fetching NAS routers:", error);
    return {
      kpis: deriveNasKpis([]),
      routers: [],
      error: "Could not load the router inventory.",
    };
  }
}

/** The backend sends zoneless business-time (Africa/Nairobi, UTC+3) datetimes. */
function eatToIso(value: string | null | undefined): string | null {
  if (!value) return null;
  return /(Z|[+-]\d{2}:?\d{2})$/.test(value) ? value : `${value}+03:00`;
}

/**
 * Step 1: registers the router for zero-touch provisioning. The backend
 * creates the network_device and network_routers rows, allocates the VPN IP,
 * issues the API account and SNMP community, and returns the RouterOS
 * `/tool fetch` one-liner, which is shown verbatim — the router must reach the
 * backend's public host, which this app's BASE_API_URL may not be.
 */
export async function generateZtpScript(input: ZtpBootstrapInput): Promise<ZtpScriptResult> {
  const request: ZtpBootstrapInput = {
    identity: input.identity.trim(),
    acknowledgeDestructiveReset: input.acknowledgeDestructiveReset === true,
    hotspotEnabled: input.hotspotEnabled === true,
    pppoeEnabled: input.pppoeEnabled === true,
  };
  if (input.stationIdxno !== undefined) request.stationIdxno = input.stationIdxno;
  // ether1 is the backend's default; only another port is sent
  const wanInterface = input.wanInterface?.trim();
  if (wanInterface && wanInterface !== "ether1") request.wanInterface = wanInterface;
  const invalid = validateZtpBootstrapInput(request);
  if (invalid) return { success: false, message: invalid };

  const pagePerms = await getPermissionForRoute("/network/routers");
  if (!pagePerms.canCreate) {
    return { success: false, message: "Not authorized to provision routers." };
  }

  try {
    const res = await apiFetch<BootstrapTokenResponse>("/provision/bootstrap-tokens", {
      method: "POST",
      auth: "required",
      body: request,
    });
    if (!res.success) {
      return { success: false, message: res.message || `Provisioning request failed (HTTP ${res.status}).` };
    }

    const deviceId = res.data?.routerId;
    const fetchCommand = res.data?.fetchCommand?.trim();
    if (!fetchCommand || !Number.isInteger(deviceId)) {
      return { success: false, message: "The backend did not return a provisioning command for this router." };
    }

    revalidatePath("/network/routers");
    return {
      success: true,
      data: {
        deviceId: String(deviceId),
        routerIdxno: res.data?.routerIdxno ?? null,
        identity: res.data?.identity ?? request.identity,
        fetchCommand,
        allocatedVpnIp: res.data?.allocatedVpnIp ?? null,
        expiresAt: eatToIso(res.data?.expiresAt),
      },
    };
  } catch (error: unknown) {
    console.error("Failed to register router for ZTP:", error);
    return { success: false, message: "Could not reach the provisioning backend." };
  }
}

/**
 * Active stations of the signed-in company for the wizard's station picker,
 * labelled "Location — Station". The backend refuses a station of another
 * company, so this list is a convenience, not the access check.
 */
export async function getZtpStations(): Promise<{ stations: ZtpStationOption[]; error?: string }> {
  try {
    const res = await getRegions(true);
    if (!res.success) return { stations: [], error: res.message || "Could not load stations." };
    const stations: ZtpStationOption[] = [];
    for (const region of res.data ?? []) {
      for (const location of region.locations ?? []) {
        for (const station of location.stations ?? []) {
          if (station.isActive === false) continue;
          stations.push({ idxno: station.idxno, label: `${location.name} — ${station.name}` });
        }
      }
    }
    stations.sort((a, b) => a.label.localeCompare(b.label));
    return { stations };
  } catch (error: unknown) {
    console.error("Failed to load stations for ZTP:", error);
    return { stations: [], error: "Could not load stations." };
  }
}

/**
 * Step 2: where the router is in zero-touch provisioning, keyed by
 * network_device.id. The wizard is done once `status` is COMPLETED (the router
 * ran the script to its last line) and `online` is true (monitoring reached it
 * over the tunnel).
 */
export async function getZtpProvisioningStatus(deviceId: string): Promise<ZtpProvisioningStatus> {
  if (!/^[1-9]\d*$/.test(deviceId)) return { status: null, online: false };
  try {
    const res = await apiFetch<ProvisioningStatusResponse>(`/provision/devices/${deviceId}/status`, {
      auth: "required",
      cache: "no-store",
    });
    if (res.success && res.data) {
      return { status: res.data.status ?? null, online: res.data.online === true };
    }
  } catch (error: unknown) {
    console.warn(`Provisioning status poll failed for device ${deviceId}.`, error);
  }
  return { status: null, online: false };
}
