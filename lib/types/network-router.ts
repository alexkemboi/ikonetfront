import type { ApiResponse as BaseApiResponse } from "@/lib/types/api";

export type RouterNodeStatus = "ACTIVE" | "PASSIVE" | "UNREGISTERED" | "OFFLINE";

export type RouterAction =
  | "REBOOT"
  | "RESET"
  | "ENABLE"
  | "DISABLE"
  | "DISCONNECT"
  | "RECONNECT"
  | "PING"
  | "REFRESH"
  | "HEALTH_CHECK"
  | "START_DISCOVERY"
  | "STOP_DISCOVERY"
  | "BACKUP_CONFIG"
  | "RESTORE_CONFIG"
  | "UPDATE_FIRMWARE"
  | "DIAGNOSE"
  | "SYNC_ROUTER_TIME"
  | "SYNC_HOTSPOT_FILES"
  | "REPROVISION";

// Topology tree node — recursive
export interface TopologyNode {
  id: number;
  name: string;
  ipAddress: string;
  nodeStatus?: RouterNodeStatus;
  children: TopologyNode[];
}

// A discovered / registered network router
export interface NetworkRouter {
  id: number;
  routerName: string;
  ipAddress: string;
  serviceMode: string;
  requiresAuthentication: boolean;
  routerUsername: string;
  routerPassword: string;
  hotspotEnabled: boolean;
  pppoeEnabled: boolean;
  freeInternet: boolean;
  monitoringEnabled: boolean;
  nodeStatus?: RouterNodeStatus;
  createdAt?: string;
  updatedAt?: string;
}

// Shared body for both finalize (POST) and update (PATCH)
export interface RouterConfigRequest {
  routerName: string;
  serviceMode: string;
  requiresAuthentication: boolean;
  routerUsername: string;
  routerPassword: string;
  hotspotEnabled: boolean;
  pppoeEnabled: boolean;
  freeInternet: boolean;
  monitoringEnabled: boolean;
}

export interface RouterActionRequest {
  action: RouterAction;
  notes?: string;
}

/** Structured payload returned by DIAGNOSE — mirrors the backend details map. */
export interface DiagnoseDetails {
  cpuLoad?: string | null;
  uptime?: string | null;
  temperature?: string | null;
  wanPingLatency?: string | null;
  packetLoss?: string | null;
  radiusStatus?: string | null;
  status?: "OK" | "DEGRADED" | "WAN_DOWN" | "UNKNOWN" | string | null;
}

/** Mirrors the backend `RouterActionResponse` (`PATCH /api/v1/network-routers/{id}/action`). */
export interface RouterActionResponse {
  routerId: number;
  routerName: string;
  ipAddress: string;
  action: string;
  nodeStatus: string;
  executionStatus: string;
  message: string;
  error?: string;
  details?: DiagnoseDetails;
  timestamp: string;
}

export type ApiResponse<T> = BaseApiResponse<T> & { error?: unknown };
