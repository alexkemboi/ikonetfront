"use server";

import { auth } from "@/lib/auth";
import { BASE_URL } from "@/lib/constants";
import { apiFetch } from "@/lib/apiClient";
import {
  OutageCompensationRequest,
  SubscriberItem,
  SubscriberKpis,
  SubscriberHubResult,
  SubscriberAccountStatus,
} from "@/lib/types/subscribers";
import { getCurrentUserPermissions, NO_PERMISSIONS } from "@/lib/data/nav";

type SubscriberHubResponse = {
  kpis: SubscriberKpis;
  rows: {
    content: Array<{
      id: number;
      code: string | null;
      fullName: string | null;
      phone: string | null;
      email: string | null;
      type: "PPPOE" | "HOTSPOT" | "TV_BUNDLED";
      planName: string | null;
      planSpeed: string | null;
      planPrice: string | null;
      expiryText: string | null;
      expiryDate: string | null;
      isExpiringToday: boolean;
      status: "ACTIVE" | "GRACE" | "EXPIRED" | "SUSPENDED";
      isOnline: boolean;
      lastSeenAt: string | null;
      activeSessionId: string | null;
      nasName: string | null;
      deviceType: string | null;
      macAddress: string | null;
      ipAddress: string | null;
    }>;
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
  };
  query?: { page: number; size: number; statusFilter: string | null; search: string | null };
};

// ── Subscribers hub data (KPI derivation locked) ─────────────────────────────

export async function getSubscribersData(options: { page?: number; size?: number; statusFilter?: SubscriberAccountStatus | "ALL"; search?: string } = {}): Promise<SubscriberHubResult> {
  try {
    const query = new URLSearchParams({ page: String(Math.max(0, options.page ?? 0)), size: String(Math.min(Math.max(1, options.size ?? 25), 200)) });
    if (options.statusFilter && options.statusFilter !== "ALL") query.set("statusFilter", options.statusFilter);
    if (options.search?.trim()) query.set("search", options.search.trim());
    const res = await apiFetch<SubscriberHubResponse>(`/subscribers/hub?${query.toString()}`, {
      auth: "required",
      cache: "no-store",
      tags: ["subscribers:hub"],
    });
    if (!res.success || !res.data) return { success: false, message: res.message, requestId: res.requestId, kpis: null, rows: null };

    const content: SubscriberItem[] = res.data.rows.content.map((row) => ({
      id: String(row.id),
      code: row.code ?? "—",
      fullName: row.fullName ?? "—",
      phone: row.phone ?? "—",
      email: row.email ?? undefined,
      type: row.type,
      planName: row.planName ?? "—",
      planSpeed: row.planSpeed ?? "—",
      planPrice: row.planPrice,
      expiryText: row.expiryText ?? "—",
      expiryDate: row.expiryDate ?? undefined,
      isExpiringToday: row.isExpiringToday,
      status: row.status,
      isOnline: row.isOnline,
      lastSeenAt: row.lastSeenAt,
      activeSessionId: row.activeSessionId,
      nasName: row.nasName ?? "—",
      deviceType: row.deviceType ?? undefined,
      macAddress: row.macAddress ?? undefined,
      ipAddress: row.ipAddress ?? undefined,
    }));

    return { success: true, requestId: res.requestId, kpis: res.data.kpis, rows: { ...res.data.rows, content } };
  } catch (error) {
    console.warn("Failed to fetch subscriber hub data:", error);
    return { success: false, message: "DATA_SOURCE_UNAVAILABLE", kpis: null, rows: null };
  }
}

// ── Outage compensation ──────────────────────────────────────────────────────

export async function submitOutageCompensation(
  request: OutageCompensationRequest
): Promise<{ success: boolean; message: string }> {
  const session = await auth();
  const token = session?.user?.apiToken;
  if (!token) {
    return { success: false, message: "You must be signed in to compensate subscribers." };
  }

  const permissions = await getCurrentUserPermissions();
  const perms = permissions["/customers"] ?? NO_PERMISSIONS;
  if (!perms.canEdit && !perms.canCreate && !perms.canDelete) {
    return {
      success: false,
      message: "You don't have permission to apply outage compensation.",
    };
  }

  if (request.policy === "PAUSE" && (!request.durationMinutes || request.durationMinutes <= 0)) {
    return {
      success: false,
      message: "A positive pause duration is required for the PAUSE policy.",
    };
  }
  if (
    request.policy === "COMPENSATE" &&
    (request.creditKsh == null || request.creditKsh < 0)
  ) {
    return {
      success: false,
      message: "A valid credit amount is required for the COMPENSATE policy.",
    };
  }

  try {
    const res = await fetch(`${BASE_URL}network/outages/compensate`, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    });

    const body = (await res.json().catch(() => ({}))) as { message?: string };
    if (!res.ok) {
      return {
        success: false,
        message: body.message || `Compensation failed (HTTP ${res.status})`,
      };
    }

    return { success: true, message: body.message || "Compensation submitted" };
  } catch (error) {
    console.warn("Failed to submit outage compensation:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to submit compensation",
    };
  }
}