"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { apiFetch, isUnauthorized } from "@/lib/apiClient";
import { analyticsApiQuery, type AnalyticsFilters } from "@/lib/analytics/filters";
import type {
  AnalyticsNetwork,
  AnalyticsRevenue,
  AnalyticsRouters,
  AnalyticsSubscribers,
  AnalyticsSummary,
  AnalyticsTarget,
  AnalyticsTargets,
  Loaded,
  RankedCustomer,
  RankedPackage,
  Ranking,
  RouterOption,
  TargetMetric,
} from "@/lib/types/analytics";

/**
 * Analytics report reads. Each page section has its own endpoint so one slow or failing
 * section never holds back or blanks the others. Filters are validated by the backend,
 * which answers a bad one with a 400 naming the parameter.
 */
async function load<T>(path: string): Promise<Loaded<T>> {
  const res = await apiFetch<T>(path, { auth: "required", cache: "no-store" });
  if (isUnauthorized(res)) redirect("/signout?reason=session-expired");
  if (!res.success || !res.data) {
    return { success: false, message: res.message, requestId: res.requestId };
  }
  return { success: true, data: res.data, requestId: res.requestId };
}

/** The eight KPIs and the payments trend (`report` of GET /analytics/unified, without the 30-day legacy blocks). */
export async function getAnalyticsSummary(filters: AnalyticsFilters): Promise<Loaded<AnalyticsSummary>> {
  const query = analyticsApiQuery(filters, { service: true, interval: true });
  const res = await load<{ report: AnalyticsSummary | null }>(`/analytics/unified?legacy=false&${query}`);
  if (!res.success) return res;
  if (!res.data.report) {
    return { success: false, message: "The analytics service has not been updated yet.", requestId: res.requestId };
  }
  return { success: true, data: res.data.report, requestId: res.requestId };
}

export async function getAnalyticsRevenue(filters: AnalyticsFilters): Promise<Loaded<AnalyticsRevenue>> {
  return load(`/analytics/revenue?${analyticsApiQuery(filters)}`);
}

export async function getAnalyticsSubscribers(filters: AnalyticsFilters): Promise<Loaded<AnalyticsSubscribers>> {
  return load(`/analytics/subscribers?${analyticsApiQuery(filters, { interval: true })}`);
}

export async function getAnalyticsNetwork(filters: AnalyticsFilters): Promise<Loaded<AnalyticsNetwork>> {
  return load(`/analytics/network?${analyticsApiQuery(filters, { interval: true })}`);
}

export async function getAnalyticsRouters(filters: AnalyticsFilters): Promise<Loaded<AnalyticsRouters>> {
  return load(`/analytics/routers?${analyticsApiQuery(filters)}`);
}

export async function getAnalyticsRouterOptions(): Promise<Loaded<RouterOption[]>> {
  return load("/analytics/router-options");
}

export async function getAnalyticsTargets(routerId?: string): Promise<Loaded<AnalyticsTargets>> {
  return load(`/analytics/targets${routerId ? `?routerId=${encodeURIComponent(routerId)}` : ""}`);
}

/** Up to 50 ranked rows for the same dates and router as the page. */
export async function getTopPackages(filters: AnalyticsFilters): Promise<Loaded<Ranking<RankedPackage>>> {
  return load(`/analytics/top-packages?limit=50&${analyticsApiQuery(filters)}`);
}

export async function getTopCustomers(filters: AnalyticsFilters): Promise<Loaded<Ranking<RankedCustomer>>> {
  return load(`/analytics/top-customers?limit=50&${analyticsApiQuery(filters)}`);
}

/** Sets this month's target for the given router scope; setting it again replaces it. */
export async function setAnalyticsTarget(input: {
  metric: TargetMetric;
  value: string;
  routerId?: string;
}): Promise<Loaded<AnalyticsTarget>> {
  const value = input.value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(value)) {
    return { success: false, message: "Enter an amount of 0 or more." };
  }
  if (input.metric === "NEW_SUBSCRIBERS" && value.includes(".")) {
    return { success: false, message: "A subscriber target is a whole number." };
  }
  const query = input.routerId ? `?routerId=${encodeURIComponent(input.routerId)}` : "";
  const res = await apiFetch<AnalyticsTarget>(`/analytics/targets${query}`, {
    method: "PUT",
    auth: "required",
    body: { metric: input.metric, value },
  });
  if (isUnauthorized(res)) redirect("/signout?reason=session-expired");
  if (!res.success || !res.data) {
    return { success: false, message: res.message || "The target could not be saved.", requestId: res.requestId };
  }
  revalidatePath("/analytics");
  return { success: true, data: res.data, requestId: res.requestId };
}
