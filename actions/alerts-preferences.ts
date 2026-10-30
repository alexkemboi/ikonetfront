"use server";

import { apiFetch } from "@/lib/apiClient";

/** One alert on "My alerts": email is on unless switched off; text only where offered. */
export interface AlertSetting {
  type: string;
  label: string;
  description: string;
  offersSms: boolean;
  email: boolean;
  sms: boolean;
}

export interface MyAlertSettings {
  email: string | null;
  phone: string | null;
  alerts: AlertSetting[];
}

export interface SentAlert {
  id: number;
  type: string;
  label: string;
  subject: string;
  emails: number;
  emailsSent: number;
  emailsFailed: number;
  texts: number;
  createdAt: string;
}

export async function getMyAlertSettings(): Promise<{ data: MyAlertSettings | null; message?: string }> {
  const res = await apiFetch<MyAlertSettings>("/me/alert-preferences", { auth: "required", cache: "no-store" });
  return { data: res.success ? res.data ?? null : null, message: res.success ? undefined : res.message };
}

export async function saveMyAlertSettings(
  changes: Array<{ type: string; email: boolean; sms: boolean }>
): Promise<{ success: boolean; message?: string; data?: MyAlertSettings }> {
  const res = await apiFetch<MyAlertSettings>("/me/alert-preferences", {
    method: "PUT",
    body: changes,
    auth: "required",
    cache: "no-store",
  });
  return { success: res.success, message: res.message, data: res.data ?? undefined };
}

/** Admins only: the alerts recently sent in their company (all of them for a platform admin). */
export async function getRecentStaffAlerts(): Promise<{ data: SentAlert[]; allowed: boolean }> {
  const res = await apiFetch<SentAlert[]>("/staff-alerts?limit=50", { auth: "required", cache: "no-store" });
  return { data: res.success && Array.isArray(res.data) ? res.data : [], allowed: res.success };
}
