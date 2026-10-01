"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/apiClient";
import { getCurrentUserPermissions, NO_PERMISSIONS } from "@/lib/data/nav";
import type { LiveSessionItem, LiveSessionKpis, SessionProtocol } from "@/lib/types/sessions";

/**
 * Live sessions — `GET /api/v1/sessions/live`.
 *
 * The backend joins every open RADIUS accounting row to who it belongs to:
 * PPPoE account, or hotspot session → M-Pesa payment (phone, receipt, package)
 * → router. Traffic is the router's own accounting (radacct octets); company
 * scope is enforced server-side. No synthesized or demo rows: an empty or failed
 * read renders as an empty table.
 */

interface LiveSessionDto {
  subscriberCode?: string;
  subscriberName?: string;
  protocol?: string;
  deviceMac?: string;
  assignedIp?: string;
  routerName?: string;
  routerManagementIp?: string;
  downloadBytes?: string | number;
  uploadBytes?: string | number;
  onlineDurationFormatted?: string;
  connectedAt?: string;
  expiryFormatted?: string;
  sessionId?: number | null;
  phone?: string | null;
  packageName?: string | null;
  voucherCode?: string | null;
  mpesaReceipt?: string | null;
  amountPaid?: string | null;
  nasIp?: string | null;
  online?: boolean;
  expiresAt?: string | null;
  minutesRemaining?: number | null;
  lastSeenAt?: string | null;
}

interface LiveSessionListDto {
  kpis?: {
    currentlyConnected?: number;
    pppoeCount?: number;
    hotspotCount?: number;
    paidNotConnected?: number;
    lostContact?: number;
    downloadBytesTotal?: string | number;
    uploadBytesTotal?: string | number;
    totalBytesTotal?: string | number;
  };
  sessions?: { content?: LiveSessionDto[] };
}

const EMPTY_KPIS: LiveSessionKpis = {
  currentlyConnected: 0,
  pppoeCount: 0,
  hotspotCount: 0,
  paidNotConnected: 0,
  lostContact: 0,
  downloadTrafficGb: 0,
  uploadTrafficGb: 0,
  totalTrafficGb: 0,
};

function toNumber(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function toGb(bytes: unknown): number {
  return +(toNumber(bytes) / 1e9).toFixed(1);
}

function toProtocol(value?: string): SessionProtocol {
  const p = String(value ?? "").toUpperCase();
  if (p === "PPPOE") return "PPPOE";
  if (p.startsWith("TV")) return "TV";
  return "HOTSPOT";
}

function mapSession(dto: LiveSessionDto, index: number): LiveSessionItem {
  const downloadBytes = toNumber(dto.downloadBytes);
  const uploadBytes = toNumber(dto.uploadBytes);
  return {
    id: dto.sessionId != null
      ? `hs-${dto.sessionId}`
      : `ra-${dto.subscriberCode ?? ""}-${dto.deviceMac ?? ""}-${index}`,
    subscriberCode: dto.subscriberCode || "—",
    subscriberName: dto.subscriberName || "—",
    protocol: toProtocol(dto.protocol),
    deviceMac: dto.deviceMac || "—",
    assignedIp: dto.assignedIp || "—",
    routerName: dto.routerName || "Unknown router",
    routerManagementIp: dto.routerManagementIp || "",
    // The backend sends raw octet counters; they are kept as strings so large
    // values never lose precision, and formatted on render via formatBytes().
    downloadBytes: dto.downloadBytes == null ? null : String(dto.downloadBytes),
    uploadBytes: dto.uploadBytes == null ? null : String(dto.uploadBytes),
    countersAvailable: downloadBytes > 0 || uploadBytes > 0,
    onlineDurationFormatted: dto.onlineDurationFormatted || "—",
    connectedAt: dto.connectedAt ?? null,
    expiryDate: null,
    expiresAt: dto.expiresAt ?? null,
    expiryFormatted: dto.expiryFormatted || "—",
    leaseExpiry: dto.expiresAt ?? undefined,
    sessionId: dto.sessionId ?? undefined,
    phone: dto.phone ?? undefined,
    packageName: dto.packageName ?? undefined,
    voucherCode: dto.voucherCode ?? undefined,
    mpesaReceipt: dto.mpesaReceipt ?? undefined,
    amountPaid: dto.amountPaid ?? undefined,
    nasIp: dto.nasIp ?? undefined,
    online: dto.online !== false,
    minutesRemaining: dto.minutesRemaining ?? null,
    lastSeenAt: dto.lastSeenAt ?? undefined,
  };
}

export async function getLiveSessionsData(): Promise<{
  kpis: LiveSessionKpis;
  sessions: LiveSessionItem[];
  error?: string;
}> {
  const res = await apiFetch<LiveSessionListDto>("/sessions/live?page=0&size=500", {
    auth: "required",
  });
  if (!res.success || !res.data) {
    return { kpis: EMPTY_KPIS, sessions: [], error: res.message || "Live sessions are unavailable." };
  }
  const k = res.data.kpis ?? {};
  const sessions = (res.data.sessions?.content ?? []).map(mapSession);
  const kpis: LiveSessionKpis = {
    currentlyConnected: toNumber(k.currentlyConnected),
    pppoeCount: toNumber(k.pppoeCount),
    hotspotCount: toNumber(k.hotspotCount),
    paidNotConnected: toNumber(k.paidNotConnected),
    lostContact: toNumber(k.lostContact),
    downloadTrafficGb: toGb(k.downloadBytesTotal),
    uploadTrafficGb: toGb(k.uploadBytesTotal),
    totalTrafficGb: toGb(k.totalBytesTotal),
  };
  return { kpis, sessions };
}

/**
 * Disconnect a hotspot session — `POST /api/v1/hotspot/sessions/{id}/disconnect`.
 * Ends the paid session, removes its RADIUS rows and kicks the device off the
 * router (audit-logged). PPPoE disconnect needs the RADIUS CoA HTTP adapter,
 * which the backend does not expose yet, so it is refused here explicitly.
 */
export async function disconnectLiveSession(
  sessionId: number | undefined,
  reason?: string
): Promise<{ success: boolean; message: string }> {
  const permissions = await getCurrentUserPermissions();
  const perms = permissions["/network/live-sessions"] ?? NO_PERMISSIONS;
  if (!perms.canEdit && !perms.canCreate && !perms.canDelete) {
    return { success: false, message: "You don't have permission to disconnect live sessions." };
  }
  if (!sessionId) {
    return {
      success: false,
      message: "Only hotspot sessions can be disconnected from here for now (PPPoE disconnect is not available yet).",
    };
  }
  const query = reason?.trim() ? `?reason=${encodeURIComponent(reason.trim())}` : "";
  const res = await apiFetch<null>(`/hotspot/sessions/${sessionId}/disconnect${query}`, {
    method: "POST",
    auth: "required",
  });
  if (!res.success) {
    return { success: false, message: res.message || "Failed to disconnect the session." };
  }
  revalidatePath("/network/live-sessions");
  return { success: true, message: "Session disconnected — the device has been removed from the router." };
}
