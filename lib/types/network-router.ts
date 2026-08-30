import type { ApiResponse as BaseApiResponse } from "@/lib/types/api";

export type RouterNodeStatus = "ACTIVE" | "PASSIVE" | "UNREGISTERED" | "OFFLINE";

export type RouterAction =
  | "REBOOT"
  | "RESET"
  | "DISCONNECT"
  | "ENABLE"
  | "DISABLE"
  | "REFRESH"
  | "PING";

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
  notes: string;
}

export interface RouterActionResponse {
  action: RouterAction;
  success: boolean;
  message: string;
  output?: string;
}

export type ApiResponse<T> = BaseApiResponse<T> & { error?: unknown };
