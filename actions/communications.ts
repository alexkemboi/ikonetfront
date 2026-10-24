"use server";

import { apiFetch } from "@/lib/apiClient";

export interface EmailCatalogResult<T> {
  success: boolean;
  data: T[];
  message?: string;
  status?: number;
  requestId?: string;
}

export async function getEmailTemplates(): Promise<EmailCatalogResult<unknown>> {
  const res = await apiFetch<unknown[]>("/communications/email/templates", { auth: "required", cache: "no-store" });
  return {
    success: res.success && Array.isArray(res.data),
    data: Array.isArray(res.data) ? res.data : [],
    message: res.message,
    status: res.status,
    requestId: res.requestId,
  };
}

export async function sendBulkEmailAction(payload: {
  recipients: Array<{ recipientType: "CUSTOMER" | "SYSTEM_USER"; recipientId: number }>;
  templateId: string;
  subject: string;
  body: string;
}) {
  if (payload.recipients.length === 0) {
    return { success: false, message: "Select at least one recipient.", status: 400 };
  }
  const res = await apiFetch<{ queued?: boolean }>("/communications/email/send", {
    method: "POST",
    body: payload,
    auth: "required",
    cache: "no-store",
  });
  return { success: res.success, message: res.message, status: res.status, requestId: res.requestId };
}
// ── Sender settings (per company) ─────────────────────────────────────────────

/** Empty fields mean "NotifyHub's default sender for the business". */
export interface SenderSettings {
  smsSenderId: string | null;
  emailFromName: string | null;
  emailFromAddress: string | null;
  emailReplyTo: string | null;
}

export async function getSenderSettings(): Promise<{ data: SenderSettings | null; message?: string }> {
  const res = await apiFetch<SenderSettings>("/communications/sender-settings", { auth: "required", cache: "no-store" });
  return { data: res.success ? res.data ?? null : null, message: res.success ? undefined : res.message };
}

export async function saveSenderSettings(
  value: SenderSettings
): Promise<{ success: boolean; message?: string; data?: SenderSettings }> {
  const res = await apiFetch<SenderSettings>("/communications/sender-settings", {
    method: "PUT",
    body: value,
    auth: "required",
    cache: "no-store",
  });
  return { success: res.success, message: res.message, data: res.data ?? undefined };
}

// ── Send history ──────────────────────────────────────────────────────────────

export interface EmailCampaignSummary {
  id: number;
  subject: string;
  category: "TRANSACTIONAL" | "MARKETING";
  recipients: number;
  sent: number;
  queued: number;
  failed: number;
  skipped: number;
  createdBy: string | null;
  createdAt: string;
}

export async function getEmailCampaigns(): Promise<EmailCampaignSummary[]> {
  const res = await apiFetch<EmailCampaignSummary[]>("/communications/email/campaigns", {
    auth: "required",
    cache: "no-store",
  });
  return res.success && Array.isArray(res.data) ? res.data : [];
}
