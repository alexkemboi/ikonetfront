"use server";

import { withCompanyContext } from "@/lib/companyContext";
import { auth } from "@/lib/auth";
import { buildApiUrl } from "@/lib/constants";
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
  // Forward the SYSADMIN-selected company so the backend scopes the call.
  return withCompanyContext(headers as Record<string, string>);
}

export async function getAuditLogsAction(): Promise<ApiResponse<AuditLog[]>> {
  try {
    const res = await fetch(
      buildApiUrl("/systemsetup/audit-logs"),
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
