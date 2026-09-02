"use server";

import { revalidatePath } from "next/cache";
import type { ApiResponse } from "@/lib/types/auth";
import { apiFetch } from "@/lib/apiClient";

// ── Types ────────────────────────────────────────────────────────────────
export type AlertProvider = {
  idxno:        number;
  channel:      string;
  providerName: string;
  apiUrl:       string;
  apiKey:       string;
  senderId:     string;
  fromEmail:    string;
  fromName:     string;
  isActive:     boolean;
  createdAt:    string | null;
  updatedAt:    string | null;
};

export type AlertProviderPayload = {
  channel:      string;
  providerName: string;
  apiUrl:       string;
  apiKey:       string;
  apiSecret:    string;
  senderId:     string;
  fromEmail:    string;
  fromName:     string;
  isActive:     boolean;
};

// ── GET all providers ────────────────────────────────────────────────────
export async function getProvidersAction(): Promise<ApiResponse<AlertProvider[]>> {
  const res = await apiFetch<AlertProvider[]>("/notification-providers", {
    auth: "required",
    cache: "no-store",
  });
  return res.success && Array.isArray(res.data)
    ? res
    : { status: res.status, success: false, message: res.message || "Network error. Please try again.", data: [], timestamp: res.timestamp };
}

// ── CREATE provider ──────────────────────────────────────────────────────
export async function createProviderAction(
  payload: AlertProviderPayload
): Promise<ApiResponse<AlertProvider>> {
  const res = await apiFetch<AlertProvider>("/notification-providers", {
    method: "POST",
    body: payload,
    auth: "required",
    cache: "no-store",
  });
  if (res.success) revalidatePath("/settings/alerts");
  return res;
}

// ── UPDATE provider ──────────────────────────────────────────────────────
export async function updateProviderAction(
  id: number,
  payload: AlertProviderPayload
): Promise<ApiResponse<AlertProvider>> {
  const res = await apiFetch<AlertProvider>(`/notification-providers/${id}`, {
    method: "PUT",
    body: payload,
    auth: "required",
    cache: "no-store",
  });
  if (res.success) revalidatePath("/settings/alerts");
  return res;
}

// ── DELETE provider ──────────────────────────────────────────────────────
export async function deleteProviderAction(
  id: number
): Promise<ApiResponse<string>> {
  const res = await apiFetch<string>(`/notification-providers/${id}`, {
    method: "DELETE",
    auth: "required",
    cache: "no-store",
  });
  if (res.success) revalidatePath("/settings/alerts");
  return res;
}