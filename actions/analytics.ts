"use server";

import { apiFetch } from "@/lib/apiClient";
import type { AnalyticsDashboardData, AnalyticsLoadResult } from "@/lib/types/analytics";

export async function getNetworkAnalyticsData(companyId?: string | null): Promise<AnalyticsLoadResult> {
  const query = new URLSearchParams();
  if (companyId) query.set("companyId", companyId);
  const path = `/analytics/unified${query.size ? `?${query.toString()}` : ""}`;
  const res = await apiFetch<AnalyticsDashboardData>(path, {
    auth: "required",
    cache: "no-store",
  });
  if (!res.success || !res.data) {
    return { success: false, message: res.message, requestId: res.requestId };
  }
  return { success: true, data: res.data, requestId: res.requestId };
}
