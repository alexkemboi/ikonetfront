
import type { ApiResponse as BaseApiResponse } from "@/lib/types/api";

export interface MikrotikDevice {
  id: number;
  name: string;
  ipAddress: string;
  port: number;
  location: string;
  active: boolean;
  createdAt: string;
  deviceType: string;
  site: string;
  region: string;
  online: boolean;
  cpuLoad: string | null;
  uptime: string | null;
  /** Track 1: on-demand WinBox relay lease surfaced on the device row. */
  winboxTunnelPort?: number | null;
  webfigProxyEnabled?: boolean | null;
  tunnelExpiresAt?: string | null;
  winboxTunnelAddress?: string | null;
  webConsoleUrl?: string | null;
}

export interface MikrotikDeviceStatus {
  deviceId: number;
  name: string;
  ipAddress: string;
  deviceType: string;
  online: boolean;
  identity: string;
  version: string;
  uptime: string;
  cpuLoad: string;
  freeMemory: string;
  totalMemory: string;
  interfaces: MikrotikInterface[];
  neighbors: MikrotikNeighbor[];
}

export interface MikrotikInterface {
  type: string;
  ".id": string;
  name: string;
  "default-name": string;
  mtu: string;
  "actual-mtu": string;
  l2mtu: string;
  "max-l2mtu": string;
  "mac-address": string;
  "last-link-up-time"?: string;
  "last-link-down-time"?: string;
  "link-downs": string;
  "rx-byte": string;
  "tx-byte": string;
  "rx-packet": string;
  "tx-packet": string;
  "tx-queue-drop": string;
  "fp-rx-byte": string;
  "fp-tx-byte": string;
  "fp-rx-packet": string;
  "fp-tx-packet": string;
  running: string;
  slave?: string;
  disabled: string;
  "rx-drop"?: string;
  "tx-drop"?: string;
  "rx-error"?: string;
  "tx-error"?: string;
  comment?: string;
}

export interface MikrotikNeighbor {
  type: string;
  ".id": string;
  interface: string;
  address: string;
  address4: string;
  address6: string;
  "mac-address": string;
  identity: string;
  platform: string;
  version: string;
  unpack: string;
  age: string;
  uptime: string;
  "software-id": string;
  board: string;
  ipv6: string;
  "interface-name": string;
  "system-caps": string;
  "system-caps-enabled": string;
  "discovered-by": string;
}

export interface AddMikrotikDevicePayload {
  name: string;
  ipAddress: string;
  port: number;
  deviceType: string;
  username?: string;
  password?: string;
  snmpCommunity?: string;
  snmpVersion?: string;
  site: string;
  region: string;
  location: string;
  maxSessions?: number;
  description?: string;
}

export type ApiResponse<T> = BaseApiResponse<T> & { error?: unknown };
