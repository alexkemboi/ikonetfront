import type { IpMappingResponse as BaseIpMappingResponse } from "@/lib/types/api";

export type SessionProtocol = "PPPOE" | "HOTSPOT" | "TV";

export type IpMappingResponse = BaseIpMappingResponse;

export interface LiveSessionItem {
  id: string;
  subscriberCode: string;
  subscriberName: string;
  protocol: SessionProtocol;
  deviceMac: string;
  assignedIp: string;
  routerName: string;
  routerManagementIp: string;
  downloadBytes: string | null;
  uploadBytes: string | null;
  countersAvailable: boolean;
  onlineDurationFormatted: string;
  connectedAt: string | null;
  expiryDate: string | null;
  expiresAt: string | null;
  expiryFormatted: string;
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
  /** When the router reported a stop for a paid, unexpired purchase that is not connected now. */
  offlineSince?: string;
}

/**
 * online: router reporting now · lost: router stopped reporting (no Stop) · offline: was
 * connected, the router reported a stop, the package is still valid · waiting: paid, never connected.
 */
export type SessionState = "ONLINE" | "LOST" | "OFFLINE" | "WAITING";

export function sessionState(s: Pick<LiveSessionItem, "online" | "lastSeenAt" | "offlineSince">): SessionState {
  if (s.online) return "ONLINE";
  if (s.lastSeenAt) return "LOST";
  return s.offlineSince ? "OFFLINE" : "WAITING";
}

export interface LiveSessionKpis {
  currentlyConnected: number;
  pppoeCount: number;
  hotspotCount: number;
  /** Hotspot customers who paid and whom the router has never reported: they need help or compensation. */
  paidNotConnected: number;
  /** Hotspot customers with a valid package who were connected and went offline; they can come back. */
  offline: number;
  /** Sessions the router stopped reporting without a Stop (router/CPE lost power or link). */
  lostContact: number;
  downloadTrafficGb: number;
  uploadTrafficGb: number;
  totalTrafficGb: number;
}
