import type { IpMappingResponse as BaseIpMappingResponse } from "@/lib/types/api";

export type SessionProtocol = "PPPOE" | "HOTSPOT" | "TV";

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
  // ── Identity chain (hotspot): RADIUS row → session → M-Pesa payment ──
  /** hotspot_session.id — target of the hotspot disconnect action. */
  sessionId?: number;
  /** Payer phone (hotspot) or customer phone (PPPoE). */
  phone?: string;
  packageName?: string;
  voucherCode?: string;
  mpesaReceipt?: string;
  amountPaid?: string;
  nasIp?: string;
  /** false = paid, unexpired entitlement but the router reports no traffic session. */
  online: boolean;
  minutesRemaining?: number | null;
  /** Last time the router reported the session; absent = never connected. */
  lastSeenAt?: string;
}

/** online: router reporting now · lost: router stopped reporting (no Stop) · waiting: paid, never connected. */
export type SessionState = "ONLINE" | "LOST" | "WAITING";

export function sessionState(s: Pick<LiveSessionItem, "online" | "lastSeenAt">): SessionState {
  if (s.online) return "ONLINE";
  return s.lastSeenAt ? "LOST" : "WAITING";
}

export interface LiveSessionKpis {
  currentlyConnectedCount: number;
  pppoeCount: number;
  hotspotCount: number;
  /** Hotspot customers with a paid, unexpired session who are not online now. */
  paidNotConnected: number;
  /** Sessions the router stopped reporting without a Stop (router/CPE lost power or link). */
  lostContact: number;
  downloadTrafficGb: number;
  uploadTrafficGb: number;
  totalTrafficGb: number;
}