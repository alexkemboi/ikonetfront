import type { IpMappingResponse as BaseIpMappingResponse } from "@/lib/types/api";

export type SessionProtocol = "PPPOE" | "HOTSPOT";

export type IpMappingResponse = BaseIpMappingResponse;

export interface LiveSessionItem {
  id: string;
  subscriberCode: string;
  subscriberName?: string;
  protocol: SessionProtocol;
  deviceMac: string;
  assignedIp: string;
  routerName: string;
  routerManagementIp: string;
  downloadBytes: number;
  uploadBytes: number;
  downloadFormatted: string;
  uploadFormatted: string;
  onlineDurationFormatted: string;
  expiryFormatted: string;
  connectedAt?: string;
  leaseExpiry?: string;
  isFallback?: boolean;
}

export interface LiveSessionKpis {
  currentlyConnectedCount: number;
  pppoeCount: number;
  hotspotCount: number;
  downloadTrafficGb: number;
  uploadTrafficGb: number;
  totalTrafficGb: number;
}