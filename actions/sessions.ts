"use server";

import { auth } from "@/lib/auth";
import { apiFetch } from "@/lib/apiClient";
import { getCurrentUserPermissions, NO_PERMISSIONS } from "@/lib/data/nav";
import type { LiveSessionItem, LiveSessionKpis, LiveSessionsPage, LiveSessionsResult } from "@/lib/types/sessions";

type LiveSessionApiResponse = {
  kpis: LiveSessionKpis;
  sessions: Omit<LiveSessionsPage, "content"> & { content: Array<Omit<LiveSessionItem, "id"> & { id?: string }> };
  scope: { companyId: string | null; stationId: string | null; page: number; size: number };
  generatedAt: string;
  refreshIntervalSeconds: number;
};

export async function getLiveSessionsData(page = 0, size = 50): Promise<LiveSessionsResult> {
  const requestId = crypto.randomUUID();
  try {
    const query = new URLSearchParams({ page: String(Math.max(0, page)), size: String(Math.min(Math.max(1, size), 200)) });
    const res = await apiFetch<LiveSessionApiResponse>(`/sessions/live?${query.toString()}`, {
      auth: "required",
      cache: "no-store",
      headers: { "X-Request-Id": requestId },
    });
    if (!res.success || !res.data) {
      return { success: false, status: res.status, requestId: res.requestId, message: res.message, kpis: null, sessions: null, refreshIntervalSeconds: 30 };
    }

    const api = res.data;
    const sessions: LiveSessionsPage = {
      ...api.sessions,
      content: api.sessions.content.map((item, index) => ({
        ...item,
        id: item.id ?? `${item.sessionId ?? item.subscriberCode}-${item.deviceMac}-${index}`,
      })),
    };
    return {
      success: true,
      requestId: res.requestId,
      kpis: api.kpis,
      sessions,
      refreshIntervalSeconds: api.refreshIntervalSeconds || 30,
    };
  } catch (error) {
    console.warn("Failed to fetch live session telemetry:", error);
    return {
      success: false,
      message: "LIVE_SESSIONS_UNAVAILABLE",
      requestId,
      kpis: null,
      sessions: null,
      refreshIntervalSeconds: 30,
    };
  }
}

// ── RFC 5176 CoA disconnect (GATED until BE-AAA-043) ─────────────────────────

export async function disconnectLiveSession(
  username: string,
  nasIp: string
): Promise<{ success: boolean; message: string }> {
  const session = await auth();
  const token = session?.user?.apiToken;
  if (!token) {
    return { success: false, message: "You must be signed in to disconnect sessions." };
  }

  const permissions = await getCurrentUserPermissions();
  const perms = permissions["/network/live-sessions"] ?? NO_PERMISSIONS;
  if (!perms.canEdit && !perms.canCreate && !perms.canDelete) {
    return {
      success: false,
      message: "You don't have permission to disconnect live sessions.",
    };
  }

  if (!username || username === "—" || !nasIp) {
    return {
      success: false,
      message: "A valid subscriber and NAS are required to disconnect.",
    };
  }

  // GATED: the RFC 5176 CoA HTTP adapter (`POST /api/v1/radius/coa/disconnect`)
  // does not exist in the backend (UDP 3799 engine is server-side only).
  // Re-enable once BE-AAA-043 lands; the UI control is disabled meanwhile.
  return {
    success: false,
    message:
      "Session disconnect is disabled — pending the backend RADIUS CoA HTTP adapter (BE-AAA-043).",
  };
}