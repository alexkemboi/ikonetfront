"use server";

import type { ApiResponse } from "@/lib/types/auth";
import { apiFetch } from "@/lib/apiClient";

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

export async function getAuditLogsAction(): Promise<ApiResponse<AuditLog[]>> {
  const res = await apiFetch<AuditLog[]>("/systemsetup/audit-logs", {
    auth: "required",
    cache: "no-store",
  });
  return res.success && Array.isArray(res.data)
    ? res
    : {
        status: res.status,
        success: false,
        message: res.message || "Failed to fetch audit logs",
        data: [],
        timestamp: res.timestamp,
      };
}