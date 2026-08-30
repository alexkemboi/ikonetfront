"use server";

import { auth } from "@/lib/auth";
import { buildApiUrl } from "@/lib/constants";

async function getAuthHeaders(): Promise<Record<string, string>> {
  const session = await auth();
  if (!session?.user?.apiToken) {
    throw new Error("Unauthorized: No active backend session.");
  }
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${session.user.apiToken}`,
  };
}

export async function getEmailTemplates() {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(buildApiUrl("/communications/email/templates"), {
      headers,
      cache: "no-store",
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      throw new Error(
        `Failed to fetch email templates (${res.status}): ${errorText || res.statusText}`
      );
    }

    return await res.json();
  } catch (error) {
    console.error("[Comm Action] getEmailTemplates error:", error);
    return { success: false, data: [], message: (error as Error).message || "Email templates unavailable." };
  }
}

export async function getAudienceSegments() {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(buildApiUrl("/communications/email/audience-segments"), {
      headers,
      cache: "no-store",
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      throw new Error(
        `Failed to fetch audience segments (${res.status}): ${errorText || res.statusText}`
      );
    }

    return await res.json();
  } catch (error) {
    console.error("[Comm Action] getAudienceSegments error:", error);
    return { success: false, data: [], message: (error as Error).message || "Audience segments unavailable." };
  }
}

export async function sendBulkEmailAction(payload: {
  segmentId: string;
  templateId: string;
  subject: string;
  body: string;
}) {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(buildApiUrl("/communications/email/send"), {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      throw new Error(
        `Failed to dispatch bulk email (${res.status}): ${errorText || res.statusText}`
      );
    }

    return await res.json();
  } catch (error) {
    console.error("[Comm Action] sendBulkEmailAction error:", error);
    return { success: false, message: (error as Error).message || "Failed to send bulk email." };
  }
}