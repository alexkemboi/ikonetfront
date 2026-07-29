"use server";

import { auth } from "@/lib/auth";
import { BASE_URL } from "@/lib/constants";

async function getAuthHeaders(): Promise<Record<string, string>> {
  const session = await auth();
  if (!session?.user?.apiToken) {
    throw new Error("Unauthorized: No active backend session.");
  }
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.user.apiToken}`,
  };
}

export async function getEmailTemplates() {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${BASE_URL}communications/email/templates`, { headers });
    if (!res.ok) throw new Error(`Failed to fetch email templates: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    console.error("[Comm Action] getEmailTemplates error:", error);
    return { success: false, data: [] };
  }
}

export async function getAudienceSegments() {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${BASE_URL}communications/email/audience-segments`, { headers });
    if (!res.ok) throw new Error(`Failed to fetch audience segments: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    console.error("[Comm Action] getAudienceSegments error:", error);
    return { success: false, data: [] };
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
    const res = await fetch(`${BASE_URL}communications/email/send`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Failed to dispatch bulk email: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    console.error("[Comm Action] sendBulkEmailAction error:", error);
    return { success: false, message: (error as Error).message };
  }
}