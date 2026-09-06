export type RouterOnlineStatus = "ONLINE" | "OFFLINE";

export interface NasRouterItem {
  id: string;
  name: string; // e.g. "Adrinold Ukunda", "ADRNOLDNETWORKS"
  model: string; // e.g. "RouterOS RB5009UG+S+"
  status: RouterOnlineStatus;
  activeSessions: number;
  winboxTunnelAddress: string; // e.g. "winbox.centipidbilling.com:54910"
  managementIp: string; // e.g. "10.9.86.246"
  lastOnlineText: string; // e.g. "Jul 20, 03:34 AM"
  /** network_routers.idxno — the id the telemetry/action endpoints expect. */
  routerId?: number;
  /** network_device.id — the id the interfaces/delete endpoints expect. */
  deviceId?: number;
  /** Telemetry enrichment — filled from the latest RouterHealthSnapshot when available. */
  cpuUsage?: number | null;
  freeMemory?: number | null;
  totalMemory?: number | null;
  uptime?: string | null;
}

export interface NasRouterKpis {
  totalRoutersCount: number;
  onlineCount: number;
  offlineCount: number;
  liveSessionsCount: number;
}

export interface ProvisioningScriptResponse {
  routerId: string;
  identity: string;
  token: string;
  fetchCommand: string;
  deviceModeRequired: boolean;
}

export interface RouterServicesConfigRequest {
  routerId: string;
  enableHotspot: boolean;
  enablePppoe: boolean;
  hotspotInterface?: string;
  pppoeInterface?: string;
}