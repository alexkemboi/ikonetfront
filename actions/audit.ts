"use server";

import { withCompanyContext } from "@/lib/companyContext";
import { auth } from "@/lib/auth";
import { apiFetch } from "@/lib/apiClient";
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

/**
 * Platform audit log (SYSADMIN only): company switches and other events that
 * belong to no company. Company events stay in {@link getAuditLogsAction}.
 */
export async function getPlatformAuditLogsAction() {
  return apiFetch<AuditLog[]>("/systemsetup/audit-logs/platform", {
    auth: "required",
    cache: "no-store",
  });
}

/** One page of an audit log, newest first, filtered on the server (BE-24). */
export type AuditLogPage = {
  content: AuditLog[];
  totalElements: number;
  page: number;
  size: number;
  /** modules and actions present in the whole log, for the filter lists */
  modules: string[];
  actions: string[];
};

export async function getAuditLogPage(params: {
  platform: boolean;
  page: number;
  size: number;
  search?: string;
  module?: string;
  action?: string;
}): Promise<{ data: AuditLogPage | null; error: string | null }> {
  const query = new URLSearchParams({ page: String(params.page), size: String(params.size) });
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.module) query.set("module", params.module);
  if (params.action) query.set("action", params.action);
  const path = `/systemsetup/audit-logs${params.platform ? "/platform" : ""}/page?${query.toString()}`;
  const res = await apiFetch<AuditLogPage>(path, { auth: "required", cache: "no-store" });
  return res.success && res.data
    ? { data: res.data, error: null }
    : { data: null, error: res.message || "Audit logs could not be loaded." };
}
