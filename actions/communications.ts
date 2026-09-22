"use server";

import { bulkEmailSchema, type BulkEmailValues } from "@/lib/validation/bulk-email";

export type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  body: string;
};

// Placeholder data. Swap for `apiFetch<EmailTemplate[]>("/communications/email/templates")`
// once that endpoint ships — the read action below keeps the same return shape either way.
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
  // TODO: POST the validated values to /communications/{channel}/send via apiFetch,
  // then revalidatePath("/communications/bulk-email") on success.
  const channelLabel = values.channel === "SMS" ? "SMS" : "email";
  return { success: false, message: `Bulk ${channelLabel} sending is not available yet. No message was sent.` };
}
