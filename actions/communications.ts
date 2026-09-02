"use server";

/**
 * Bulk email — GATED (entire feature).
 *
 * None of `GET /communications/email/templates`,
 * `GET /communications/email/audience-segments`, `POST /communications/email/send`
 * exist in the live spec (api-docs.json, 170 ops). Every action below returns a
 * readable 503 envelope — no speculative network calls into absent routes.
 */

const GATED_MESSAGE =
  "Bulk email is pending the backend routes (GET/POST /communications/email/* are absent from the live spec).";

export async function getEmailTemplates() {
  return { success: false, data: [], message: GATED_MESSAGE };
}

export async function getAudienceSegments() {
  return { success: false, data: [], message: GATED_MESSAGE };
}

export async function sendBulkEmailAction(payload: {
  segmentId: string;
  templateId: string;
  subject: string;
  body: string;
}) {
  void payload;
  return { success: false, message: GATED_MESSAGE };
}