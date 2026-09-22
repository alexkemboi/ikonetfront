"use server";

import { bulkEmailSchema, type BulkEmailValues } from "@/lib/validation/bulk-email";

export type AudienceSegment = {
  id: string;
  label: string;
  description: string;
  count: number;
  icon: string;
};

export type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  body: string;
};

// Placeholder data. Swap for `apiFetch<AudienceSegment[]>("/communications/email/audience-segments")`
// once that endpoint ships — the read actions below keep the same return shape either way.
const PLACEHOLDER_SEGMENTS: AudienceSegment[] = [
  { id: "expiring-7d", label: "Expiring in 7 days", description: "Subscriptions renewing within the next week.", count: 0, icon: "clock" },
  { id: "expired", label: "Expired subscribers", description: "Accounts past their renewal date.", count: 0, icon: "bell" },
  { id: "all-active", label: "All active subscribers", description: "Every customer with an active connection.", count: 0, icon: "wifi" },
  { id: "hotspot-users", label: "Hotspot users", description: "Customers who purchased a hotspot package.", count: 0, icon: "radio" },
  { id: "suspended", label: "Suspended accounts", description: "Accounts currently suspended for non-payment.", count: 0, icon: "user-x" },
  { id: "all-customers", label: "All customers", description: "Every customer on record, regardless of status.", count: 0, icon: "users" },
];

const PLACEHOLDER_TEMPLATES: EmailTemplate[] = [
  { id: "blank", name: "Blank", subject: "", body: "" },
  {
    id: "renewal-reminder",
    name: "Renewal Reminder",
    subject: "Your subscription is expiring soon",
    body: "Hi {{customer_name}},\n\nYour internet subscription is expiring soon. Renew now to avoid interruption.\n\nThank you.",
  },
  {
    id: "service-notice",
    name: "Service Notice",
    subject: "Scheduled maintenance notice",
    body: "Hi {{customer_name}},\n\nWe will be performing scheduled maintenance that may briefly affect your service.\n\nThank you for your patience.",
  },
];

export async function getAudienceSegments(): Promise<{ success: boolean; data: AudienceSegment[] }> {
  return { success: true, data: PLACEHOLDER_SEGMENTS };
}

export async function getEmailTemplates(): Promise<{ success: boolean; data: EmailTemplate[] }> {
  return { success: true, data: PLACEHOLDER_TEMPLATES };
}

export async function sendBulkEmailAction(
  values: BulkEmailValues
): Promise<{ success: boolean; message: string }> {
  try {
    await bulkEmailSchema.validate(values, { stripUnknown: true });
  } catch (error) {
    return { success: false, message: (error as Error).message || "Check the form and try again." };
  }
  // TODO: POST the validated values to /communications/email/send via apiFetch,
  // then revalidatePath("/communications/bulk-email") on success.
  return { success: false, message: "Bulk email sending is not available yet. No email was sent." };
}
