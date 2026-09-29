"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/apiClient";
import { getPermissionForRoute } from "@/lib/data/nav";
import type { AddEquipmentRequest, EquipmentItem, EquipmentKpis, EquipmentListResult, EquipmentStatus, EquipmentType } from "@/lib/types/equipment";

interface EquipmentApiResponse {
  kpis: EquipmentKpis;
  items: { content: EquipmentItem[]; totalElements: number; totalPages: number; number: number; size: number };
}

export async function getEquipmentData(options: { page?: number; size?: number; status?: EquipmentStatus | "ALL"; type?: EquipmentType | "ALL"; search?: string; dataQuality?: string } = {}): Promise<EquipmentListResult> {
  const query = new URLSearchParams({ page: String(Math.max(0, options.page ?? 0)), size: String(Math.min(Math.max(1, options.size ?? 50), 200)) });
  if (options.status && options.status !== "ALL") query.set("status", options.status);
  if (options.type && options.type !== "ALL") query.set("type", options.type);
  if (options.search?.trim()) query.set("search", options.search.trim());
  if (options.dataQuality) query.set("dataQuality", options.dataQuality);
  const result = await apiFetch<EquipmentApiResponse>(`/equipment?${query}`, { auth: "required", cache: "no-store" });
  if (!result.success || !result.data) return { success: false, message: result.message, requestId: result.requestId, kpis: null, items: null };
  return { success: true, requestId: result.requestId, kpis: result.data.kpis, items: result.data.items };
}

export async function createEquipment(request: AddEquipmentRequest): Promise<{ success: boolean; message: string; requestId?: string }> {
  const pagePerms = await getPermissionForRoute("/network/equipment");
  if (!pagePerms.canCreate) return { success: false, message: "Not authorized to add equipment." };
  const res = await apiFetch<EquipmentItem>("/equipment", { method: "POST", auth: "required", body: request, cache: "no-store" });
  if (!res.success) return { success: false, message: res.message, requestId: res.requestId };
  revalidatePath("/network/equipment");
  return { success: true, message: res.message, requestId: res.requestId };
}

export async function updateEquipment(assetId: number, patch: Partial<AddEquipmentRequest> & { clearFields?: string[] }): Promise<{ success: boolean; message: string; requestId?: string }> {
  const pagePerms = await getPermissionForRoute("/network/equipment");
  if (!pagePerms.canEdit) return { success: false, message: "Not authorized to update equipment." };
  const res = await apiFetch<EquipmentItem>(`/equipment/${assetId}`, { method: "PATCH", auth: "required", body: patch, cache: "no-store" });
  if (!res.success) return { success: false, message: res.message, requestId: res.requestId };
  revalidatePath("/network/equipment");
  return { success: true, message: res.message, requestId: res.requestId };
}

export async function getEquipmentHistory(assetId: number) {
  return apiFetch<Array<{ historyId: number; assetId: number; action: string; snapshot: unknown; operator: string | null; changeTypes: string[] | null; changes: Record<string, { from: unknown; to: unknown }> | null; reason: string | null; createdAt: string }>>(`/equipment/${assetId}/history`, { auth: "required", cache: "no-store" });
}
