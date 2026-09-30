"use server";

import { apiFetch } from "@/lib/apiClient";
import type {
  AdminDashboardLoadResult,
  AdminDashboardResponse,
  DashboardOverviewData,
} from "@/lib/types/dashboard";

export async function getAdminDashboardData(): Promise<AdminDashboardLoadResult> {
  const res = await apiFetch<AdminDashboardResponse>("/dashboard/admin", {
    auth: "required",
    cache: "no-store",
  });
  if (!res.success || !res.data) {
    return { success: false, message: res.message, requestId: res.requestId };
  }
  return { success: true, data: res.data, requestId: res.requestId };
}

export type DashboardOverviewLoadResult =
  | { success: true; data: DashboardOverviewData; requestId?: string }
  | { success: false; message: string; requestId?: string };

export async function getDashboardOverview(): Promise<DashboardOverviewLoadResult> {
  const res = await apiFetch<DashboardOverviewData & { tenantName?: string }>(
    "/dashboard/operations-cockpit",
    {
      auth: "required",
      cache: "no-store",
    }
  );
  if (!res.success || !res.data) {
    return { success: false, message: res.message, requestId: res.requestId };
  }

  return {
    success: true,
    data: {
      ...res.data,
      companyName: res.data.companyName ?? res.data.tenantName ?? "",
    },
    requestId: res.requestId,
  };
}
