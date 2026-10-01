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