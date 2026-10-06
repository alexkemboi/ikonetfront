export type RouterOnlineStatus = "ONLINE" | "DEGRADED" | "OFFLINE" | "NOT_PROVISIONED";

export interface NasRouterItem {
  /** network_device.id as a string — stable React row key. */
  id: string;
  name: string; // e.g. "Adrinold Ukunda", "ADRNOLDNETWORKS"
  model: string; // e.g. "RouterOS RB5009UG+S+"
  status: RouterOnlineStatus;
  /** Raw online flag when the source row carries a boolean (device API). */
  online?: boolean;
  activeSessions: number | null;
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
  /** When the enriched snapshot was created (ISO) — recency governs the ONLINE badge. */
  snapshotAt?: string | null;
  /** Track 1: on-demand WinBox relay lease (e.g. "92.205.59.234:51247"). */
  winboxTunnelAddress?: string | null;
  winboxTunnelPort?: number | null;
  /** Track 1: WebFig console over the WireGuard mesh. */
  webConsoleUrl?: string | null;
  /** Track 1: lease expiry (ISO) — hides WebConsole/re-enables after it passes. */
  tunnelExpiresAt?: string | null;
  serialNumber?: string | null;
  telemetryStatus?: "LIVE" | "STALE" | "UNAVAILABLE";
  companyCode?: string | null;
  stationName?: string | null;
  links?: {
    router: string | null;
    routerAction: string | null;
    telemetryLatest: string | null;
    deviceInterfaces: string | null;
    deviceStatus: string | null;
    deviceDelete: string | null;
  };
}

export interface NasRouterKpis {
  totalRoutersCount: number;
  onlineCount: number;
  offlineCount: number;
  liveSessionsCount: number;
  healthyCount?: number;
  degradedCount?: number;
  notProvisionedCount?: number;
  cpuAvg?: number | null;
  memoryAvg?: number | null;
  rowsWithTelemetry?: number;
}

/** What the operator supplies in step 1 of the ZTP wizard. */
export interface ZtpBootstrapInput {
  identity: string;
  acknowledgeDestructiveReset: boolean;
  hotspotEnabled: boolean;
  pppoeEnabled: boolean;
  /** network station (POP) the router serves; the backend derives nothing from the name. */
  stationIdxno?: number;
  /** RouterOS interface carrying the internet uplink. Omitted means ether1. */
  wanInterface?: string;
}

/** One selectable station in the ZTP wizard. */
export interface ZtpStationOption {
  idxno: number;
  label: string;
}

/** `data` of POST /provision/bootstrap-tokens (BootstrapTokenResponse). */
export interface BootstrapTokenResponse {
  /** network_device.id — NOT network_routers.idxno. */
  routerId?: number | null;
  /** network_routers.idxno. */
  routerIdxno?: number | null;
  identity?: string | null;
  allocatedVpnIp?: string | null;
  fetchCommand?: string | null;
  /** Zoneless — backend business time (Africa/Nairobi). */
  expiresAt?: string | null;
  status?: string | null;
}

export type ZtpSessionStatus = "PENDING" | "DELIVERED" | "COMPLETED" | "EXPIRED" | "REVOKED" | "NONE";

/** `data` of GET /provision/devices/{deviceId}/status (ProvisioningStatusResponse). */
export interface ProvisioningStatusResponse {
  routerId?: number | null;
  routerIdxno?: number | null;
  identity?: string | null;
  vpnIp?: string | null;
  status?: ZtpSessionStatus | null;
  expiresAt?: string | null;
  deliveredAt?: string | null;
  online?: boolean;
  apiAuthenticated?: boolean;
}

export interface ProvisioningScriptResponse {
  /** network_device.id as a string — the id /provision/devices/{id}/status expects. */
  deviceId: string;
  /** network_routers.idxno — the id the monitoring/action endpoints expect. */
  routerIdxno: number | null;
  identity: string;
  fetchCommand: string;
  allocatedVpnIp: string | null;
  /** ISO instant with an explicit offset. */
  expiresAt: string | null;
}

export type ZtpScriptResult =
  | { success: true; data: ProvisioningScriptResponse }
  | { success: false; message: string };

/** What the Step 2 poller needs; `status` is null when the poll itself failed. */
export interface ZtpProvisioningStatus {
  status: ZtpSessionStatus | null;
  online: boolean;
}
