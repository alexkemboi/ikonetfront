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

// ── Recipients by place on the network ───────────────────────────────────────

/** Customer types: PPPoE subscribers, hotspot buyers, customer accounts with no PPPoE line. */
export type AudienceKind = "PPPOE" | "HOTSPOT" | "ACCOUNT";

/** The part of the network a message goes to; an empty list means "all". */
export interface AudienceScope {
  regionIds: number[];
  locationIds: number[];
  stationIds: number[];
  deviceIds: number[];
  kinds: AudienceKind[];
  hotspotWithinDays: number | null;
}

export interface AudienceNode {
  id: number;
  parentId: number | null;
  name: string;
  active: boolean;
  pppoe: number;
  hotspot: number;
  accounts: number;
}

export interface AudienceTree {
  regions: AudienceNode[];
  locations: AudienceNode[];
  stations: AudienceNode[];
  devices: AudienceNode[];
  unplaced: number;
}

export interface AudiencePerson {
  /** U:<account id> or P:<2547...> (a hotspot number). */
  key: string;
  kind: AudienceKind;
  userId: number | null;
  name: string | null;
  phone: string | null;
  email: string | null;
  deviceName: string | null;
  stationName: string | null;
  locationName: string | null;
  regionName: string | null;
}

export interface AudienceListing {
  people: AudiencePerson[];
  total: number;
  withPhone: number;
  withEmail: number;
  truncated: boolean;
}

export async function getAudienceTree(): Promise<{ data: AudienceTree | null; message?: string }> {
  const res = await apiFetch<AudienceTree>("/communications/audience/tree", { auth: "required", cache: "no-store" });
  return { data: res.success ? res.data ?? null : null, message: res.success ? undefined : res.message };
}

export async function getAudiencePeople(scope: AudienceScope): Promise<{ data: AudienceListing | null; message?: string }> {
  const res = await apiFetch<AudienceListing>("/communications/audience/people", {
    method: "POST",
    body: scope,
    auth: "required",
    cache: "no-store",
  });
  return { data: res.success ? res.data ?? null : null, message: res.success ? undefined : res.message };
}

/** An SMS to chosen customers. The server only texts selected people who are in `scope`. */
export async function sendSmsNoticeAction(payload: { scope: AudienceScope; keys: string[]; message: string }) {
  if (payload.keys.length === 0) {
    return { success: false, message: "Select at least one recipient.", status: 400 };
  }
  const res = await apiFetch<{ noticeId: number; recipients: number; smsPerRecipient: number; skippedNoPhone: number }>(
    "/communications/sms/send",
    { method: "POST", body: payload, auth: "required", cache: "no-store" }
  );
  return { success: res.success, message: res.message, status: res.status, requestId: res.requestId, data: res.data };
}

export interface SmsNoticeSummary {
  id: number;
  message: string;
  audience: string | null;
  recipients: number;
  createdBy: string | null;
  createdAt: string;
  queued: number;
  sent: number;
  failed: number;
  expired: number;
}

export async function getSmsNotices(): Promise<SmsNoticeSummary[]> {
  const res = await apiFetch<SmsNoticeSummary[]>("/communications/sms/notices", { auth: "required", cache: "no-store" });
  return res.success && Array.isArray(res.data) ? res.data : [];
}
