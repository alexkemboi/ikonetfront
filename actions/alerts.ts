"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import type { ApiResponse } from "@/lib/types/auth";

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

// ── Auth headers ─────────────────────────────────────────────────────────
async function getAuthHeaders(): Promise<HeadersInit> {
  const session = await auth();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (session?.user?.apiToken) {
    (headers as Record<string, string>)["Authorization"] =
      `Bearer ${session.user.apiToken}`;
  }
  return headers;
}

const BASE = () => `${process.env.BASE_API_URL}notification-providers`;

// ── GET all providers ────────────────────────────────────────────────────
export async function getProvidersAction(): Promise<ApiResponse<AlertProvider[]>> {
  try {
    const res = await fetch(BASE(), {
      headers: await getAuthHeaders(),
      cache: "no-store",
    });
    const data = await res.json();
    return data;
  } catch {
    return { status: 500, success: false, message: "Network error. Please try again.", data: [] as AlertProvider[], timestamp: "" };
  }
}

// ── CREATE provider ──────────────────────────────────────────────────────
export async function createProviderAction(
  payload: AlertProviderPayload
): Promise<ApiResponse<AlertProvider>> {
  try {
    const res = await fetch(BASE(), {
      method:  "POST",
      headers: await getAuthHeaders(),
      body:    JSON.stringify(payload),
      cache:   "no-store",
    });
    const data: ApiResponse<AlertProvider> = await res.json();
    if (data.success) revalidatePath("/settings/alerts");
    return data;
  } catch {
    return { status: 500, success: false, message: "Network error. Please try again.", data: {} as AlertProvider, timestamp: "" };
  }
}

// ── UPDATE provider ──────────────────────────────────────────────────────
export async function updateProviderAction(
  id: number,
  payload: AlertProviderPayload
): Promise<ApiResponse<AlertProvider>> {
  try {
    const res = await fetch(`${BASE()}/${id}`, {
      method:  "PUT",
      headers: await getAuthHeaders(),
      body:    JSON.stringify(payload),
      cache:   "no-store",
    });
    const data: ApiResponse<AlertProvider> = await res.json();
    if (data.success) revalidatePath("/settings/alerts");
    return data;
  } catch {
    return { status: 500, success: false, message: "Network error. Please try again.", data: {} as AlertProvider, timestamp: "" };
  }
}

// ── DELETE provider ──────────────────────────────────────────────────────
export async function deleteProviderAction(
  id: number
): Promise<ApiResponse<string>> {
  try {
    const res = await fetch(`${BASE()}/${id}`, {
      method:  "DELETE",
      headers: await getAuthHeaders(),
      cache:   "no-store",
    });
    const data: ApiResponse<string> = await res.json();
    if (data.success) revalidatePath("/settings/alerts");
    return data;
  } catch {
    return { status: 500, success: false, message: "Network error. Please try again.", data: "", timestamp: "" };
  }
}
