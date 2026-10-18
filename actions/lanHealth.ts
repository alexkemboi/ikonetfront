"use server";

import { apiFetch } from "@/lib/apiClient";
import type { LanAccessPoint, RadiusRolloutResult, RouterLanDetail, RouterLanHealth } from "@/lib/types/lanHealth";

type Result<T> = { data: T | null; error: string | null };

/** Latest customer-network check of every router the caller may see, problems first. */
export async function getLanHealth(): Promise<Result<RouterLanHealth[]>> {
  const res = await apiFetch<RouterLanHealth[]>("/network/lan-health", { auth: "required", cache: "no-store" });
  return res.success && res.data
    ? { data: res.data, error: null }
    : { data: null, error: res.message || "Could not load the customer network checks." };
}

/** One router: latest check, access points and hourly history. */
export async function getRouterLanDetail(routerId: number, hours: number = 48): Promise<Result<RouterLanDetail>> {
  const res = await apiFetch<RouterLanDetail>(`/network/lan-health/router/${routerId}?hours=${hours}`, {
    auth: "required",
    cache: "no-store",
  });
  return res.success && res.data
    ? { data: res.data, error: null }
    : { data: null, error: res.message || "Could not load this router's customer network." };
}

/** Name an access point, or stop / resume watching it. */
export async function updateAccessPoint(
  accessPointId: number,
  change: { label?: string; watched?: boolean }
): Promise<{ success: boolean; message: string; data?: LanAccessPoint }> {
  const res = await apiFetch<LanAccessPoint>(`/network/lan-health/access-points/${accessPointId}`, {
    method: "PUT",
    auth: "required",
    body: change,
  });
  return res.success && res.data
    ? { success: true, message: "Saved.", data: res.data }
    : { success: false, message: res.message || "Could not save the change." };
}

/**
 * System administrators: reprovision every router whose RADIUS password is not the current one.
 * Needs step-up (status 428 without it); use with `withStepUp`.
 */
export async function reprovisionRoutersWithOldPassword(
  stepUpToken?: string
): Promise<{ success: boolean; status?: number; message: string; data?: RadiusRolloutResult[] }> {
  const res = await apiFetch<RadiusRolloutResult[]>("/network/radius-password/reprovision", {
    method: "POST",
    auth: "required",
    stepUpToken,
  });
  return res.success && res.data
    ? { success: true, status: res.status, message: res.message || "Done.", data: res.data }
    : { success: false, status: res.status, message: res.message || "Could not reprovision the routers." };
}
