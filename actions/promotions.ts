"use server";

import { apiFetch } from "@/lib/apiClient";
import type { OptOutChannel, Promotion, PromotionOptOut, PromotionPreview } from "@/lib/types/promotions";
import type { AudienceScope } from "@/actions/communications";

type Result<T> = { data: T | null; error: string | null };
const BASE = "/communications/promotions";

function result<T>(res: { success: boolean; status?: number; data: T | null; message?: string }, fallback: string): Result<T> {
  if (res.success && res.data != null) return { data: res.data, error: null };
  // 404 on every promotions call means the server does not have this feature yet
  if (res.status === 404) {
    return { data: null, error: "Promotional SMS is not switched on on the server yet: the backend update has not been deployed. Ask your system administrator; nothing is lost in the meantime." };
  }
  return { data: null, error: res.message || fallback };
}

export async function getPromotions(): Promise<Result<Promotion[]>> {
  return result(await apiFetch<Promotion[]>(BASE, { auth: "required", cache: "no-store" }), "Could not load the promotions.");
}

/** `scope`: the part of the network it goes to; omitted = the whole company. */
export async function previewPromotion(message: string, scope?: AudienceScope): Promise<Result<PromotionPreview>> {
  return result(await apiFetch<PromotionPreview>(`${BASE}/preview`, { method: "POST", auth: "required", body: { message, scope } }),
    "Could not work out who would receive it.");
}

export async function saveDraft(name: string, message: string, id?: number, scope?: AudienceScope): Promise<Result<Promotion>> {
  const res = id == null
    ? await apiFetch<Promotion>(BASE, { method: "POST", auth: "required", body: { name, message, scope } })
    : await apiFetch<Promotion>(`${BASE}/${id}`, { method: "PUT", auth: "required", body: { name, message, scope } });
  return result(res, "Could not save the draft.");
}

export async function sendPromotion(id: number): Promise<Result<Promotion>> {
  return result(await apiFetch<Promotion>(`${BASE}/${id}/send`, { method: "POST", auth: "required", timeoutMs: 60_000 }),
    "Could not send the promotion.");
}

export async function cancelPromotion(id: number): Promise<Result<Promotion>> {
  return result(await apiFetch<Promotion>(`${BASE}/${id}/cancel`, { method: "POST", auth: "required" }),
    "Could not cancel the promotion.");
}

export async function getOptOuts(): Promise<Result<PromotionOptOut[]>> {
  return result(await apiFetch<PromotionOptOut[]>(`${BASE}/opt-outs`, { auth: "required", cache: "no-store" }),
    "Could not load the opt-outs.");
}

export async function addOptOut(phone: string, channel: OptOutChannel, note: string): Promise<Result<{ withdrawn: number }>> {
  return result(await apiFetch<{ withdrawn: number }>(`${BASE}/opt-outs`, {
    method: "POST", auth: "required", body: { phone, channel, note },
  }), "Could not record the opt-out.");
}

export async function removeOptOut(id: number): Promise<{ success: boolean; error: string | null }> {
  const res = await apiFetch<null>(`${BASE}/opt-outs/${id}`, { method: "DELETE", auth: "required" });
  return res.success ? { success: true, error: null } : { success: false, error: res.message || "Could not remove the opt-out." };
}
