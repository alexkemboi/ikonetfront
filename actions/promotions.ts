"use server";

import { apiFetch } from "@/lib/apiClient";
import type { OptOutChannel, Promotion, PromotionOptOut, PromotionPreview } from "@/lib/types/promotions";

type Result<T> = { data: T | null; error: string | null };
const BASE = "/communications/promotions";

function result<T>(res: { success: boolean; data: T | null; message?: string }, fallback: string): Result<T> {
  return res.success && res.data != null ? { data: res.data, error: null } : { data: null, error: res.message || fallback };
}

export async function getPromotions(): Promise<Result<Promotion[]>> {
  return result(await apiFetch<Promotion[]>(BASE, { auth: "required", cache: "no-store" }), "Could not load the promotions.");
}

export async function previewPromotion(message: string): Promise<Result<PromotionPreview>> {
  return result(await apiFetch<PromotionPreview>(`${BASE}/preview`, { method: "POST", auth: "required", body: { message } }),
    "Could not work out who would receive it.");
}

export async function saveDraft(name: string, message: string, id?: number): Promise<Result<Promotion>> {
  const res = id == null
    ? await apiFetch<Promotion>(BASE, { method: "POST", auth: "required", body: { name, message } })
    : await apiFetch<Promotion>(`${BASE}/${id}`, { method: "PUT", auth: "required", body: { name, message } });
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
