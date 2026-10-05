"use server";

import { apiFetch } from "@/lib/apiClient";
import { buildUnversionedApiUrl } from "@/lib/constants";
import { revalidatePath } from "next/cache";
import type { ApiRoleUser } from "@/lib/types/roles";
import type { ApiResponse } from "@/lib/types/auth";

function normalizeUserRecord(raw: unknown): ApiRoleUser {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    idxno: Number(r.idxno ?? r.userIdxno ?? r.id ?? 0),
    username: String(r.username ?? r.userName ?? r.name ?? ""),
    userId: String(r.userId ?? r.user_id ?? r.id ?? r.idxno ?? ""),
    role: String(r.role ?? r.roleCode ?? ""),
    roleName: String(r.roleName ?? r.role_name ?? r.role ?? ""),
    createdAt: String(r.createdAt ?? r.created_at ?? ""),
    isactive: Boolean(r.isactive ?? r.isActive ?? true),
    fname: String(r.fname ?? r.firstName ?? r.first_name ?? ""),
    middleName: String(r.middleName ?? r.middle_name ?? ""),
    otherName: String(r.otherName ?? r.other_name ?? ""),
    fullName: String(
      r.fullName ??
        r.full_name ??
        [r.fname, r.middleName, r.otherName].filter(Boolean).join(" ") ??
        ""
    ),
    email: String(r.email ?? ""),
    phoneNumber: String(r.phoneNumber ?? r.phone_number ?? ""),
    canLogin: Boolean(r.canLogin ?? r.can_login ?? true),
  };
}

function extractUsersPayload(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const obj = payload as Record<string, unknown> | null;
  // Paged envelope: { data: { content: [...] } }
  if (obj?.data && !Array.isArray(obj.data)) return extractUsersPayload(obj.data);
  if (obj?.data && Array.isArray(obj.data)) return obj.data;
  if (obj?.items && Array.isArray(obj.items)) return obj.items;
  if (obj?.users && Array.isArray(obj.users)) return obj.users;
  if (obj?.content && Array.isArray(obj.content)) return obj.content;
  return [];
}

export type UserData = {
  username:    string;
  password:    string;
  role:        string;
  fname:       string;
  middleName:  string;
  otherName:   string;
  email:       string;
  phoneNumber: string;
};

/** The single canonical staff user API (`SystemUsersCrudController`). */
const SYSTEM_USERS_URL = buildUnversionedApiUrl("/system-users");

export async function addSystemUser(
  userData: UserData
): Promise<ApiResponse<ApiRoleUser>> {
  // One POST, one read of the body. The company comes from the caller's own
  // company, or from the company a SYSADMIN has selected in the dashboard.
  const res = await apiFetch<unknown>(SYSTEM_USERS_URL, {
    method: "POST",
    body: {
      ...userData,
      middleName: userData.middleName || undefined,
      otherName: userData.otherName || undefined,
    },
    auth: "required",
    cache: "no-store",
  });

  if (!res.success) {
    return { ...res, data: null as unknown as ApiRoleUser };
  }

  revalidatePath("/system/users");
  return { ...res, data: normalizeUserRecord(res.data ?? userData) };
}

/** Staff users the caller may see (own company; SYSADMIN: selected company or all). */
export async function getSystemUsers(): Promise<ApiRoleUser[]> {
  const users: ApiRoleUser[] = [];
  // The API pages at 100 per request at most.
  for (let page = 0; page < 50; page += 1) {
    const res = await apiFetch<{ content?: unknown[]; totalPages?: number }>(
      `${SYSTEM_USERS_URL}?page=${page}&size=100`,
      { auth: "required", cache: "no-store" }
    );
    if (!res.success) {
      console.error("[System Users] Failed to load users.", {
        status: res.status,
        message: res.message,
        requestId: res.requestId,
      });
      break;
    }
    users.push(...extractUsersPayload(res.data).map(normalizeUserRecord));
    if (page + 1 >= (res.data?.totalPages ?? 1)) break;
  }
  return users;
}
