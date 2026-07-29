"use server";

import { auth } from "@/lib/auth";
import type { ApiResponse } from "@/lib/types/auth";

export type AuditLog = {
  idxno:             number;
  username:          string;
  module:            string;
  subModule:         string;
  actionDescription: string;
  /** HTTP verb: GET | POST | PATCH | DELETE | PUT */
  action:            string;
  accessTime:        string;
  accessTo:          string;
};

async function getAuthHeaders(): Promise<HeadersInit> {
  const session = await auth();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (session?.user?.apiToken) {
    (headers as Record<string, string>)["Authorization"] =
      `Bearer ${session.user.apiToken}`;
  }
  return headers;
}

export async function getAuditLogsAction(): Promise<ApiResponse<AuditLog[]>> {
  try {
    const res = await fetch(
      `${process.env.BASE_API_URL}systemsetup/audit-logs`,
      { headers: await getAuthHeaders(), cache: "no-store" }
    );
    const data = await res.json();
    return data;
  } catch {
    return {
      status:  500,
      success: false,
      message: "Failed to fetch audit logs",
      data:    [],
    };
  }
}
