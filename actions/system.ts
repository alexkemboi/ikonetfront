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
    companyId: typeof (r.companyId ?? r.company_id) === "string"
      ? String(r.companyId ?? r.company_id)
      : null,
    stationId: typeof (r.stationId ?? r.station_id) === "string"
      ? String(r.stationId ?? r.station_id)
      : null,
    investorId: typeof (r.investorId ?? r.investor_id) === "string"
      ? String(r.investorId ?? r.investor_id)
      : null,
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
  middleName?: string;
  otherName?:  string;
  email?:      string;
  phoneNumber?: string;
  companyId:   string;
  /** Investor party id. Required by the backend for the Network Partner role, refused for any other. */
  investorId?: string;
};

export type SystemUserUpdate = Partial<
  Pick<ApiRoleUser, "username" | "fname" | "middleName" | "otherName" | "email" | "phoneNumber" | "companyId" | "stationId" | "isactive" | "canLogin">
>;

export type SystemUsersPage = {
  content: ApiRoleUser[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

export type SystemUsersQuery = {
  q?: string;
  role?: string;
  active?: boolean;
  page?: number;
  size?: number;
};

function normalizeApiResponse<T>(res: ApiResponse<unknown>, data: T | null): ApiResponse<T | null> {
  return { ...res, data };
}

/** The single canonical staff user API (`SystemUsersCrudController`). */
const SYSTEM_USERS_URL = buildUnversionedApiUrl("/system-users");

export async function addSystemUser(
  userData: UserData
): Promise<ApiResponse<ApiRoleUser | null>> {
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
    return normalizeApiResponse(res, null);
  }

  revalidatePath("/system/users");
  return { ...res, data: normalizeUserRecord(res.data ?? userData) };
}

export async function updateSystemUser(
  id: number,
  changes: SystemUserUpdate
): Promise<ApiResponse<ApiRoleUser | null>> {
  const res = await apiFetch<unknown>(`${SYSTEM_USERS_URL}/${id}`, {
    method: "PUT",
    body: changes,
    auth: "required",
    cache: "no-store",
  });
  if (!res.success) return normalizeApiResponse(res, null);
  revalidatePath("/system/users");
  return { ...res, data: normalizeUserRecord(res.data) };
}

export async function updateSystemUserRole(
  id: number,
  role: string
): Promise<ApiResponse<ApiRoleUser | null>> {
  const res = await apiFetch<unknown>(`${SYSTEM_USERS_URL}/${id}/role`, {
    method: "PUT",
    // the backend field is `roleCode` (AssignRoleRequest); `role` was refused as "Validation failed"
    body: { roleCode: role },
    auth: "required",
    cache: "no-store",
  });
  if (!res.success) return normalizeApiResponse(res, null);
  revalidatePath("/system/users");
  return { ...res, data: normalizeUserRecord(res.data) };
}

export async function linkSystemUserInvestor(
  id: number,
  investorId: string
): Promise<ApiResponse<ApiRoleUser | null>> {
  const res = await apiFetch<unknown>(`${SYSTEM_USERS_URL}/${id}/investor`, {
    method: "PUT",
    body: { investorId },
    auth: "required",
    cache: "no-store",
  });
  if (!res.success) return normalizeApiResponse(res, null);
  revalidatePath("/system/users");
  return { ...res, data: normalizeUserRecord(res.data) };
}

export async function deleteSystemUser(id: number): Promise<ApiResponse<null>> {
  const res = await apiFetch<null>(`${SYSTEM_USERS_URL}/${id}`, {
    method: "DELETE",
    auth: "required",
    cache: "no-store",
  });
  if (res.success) revalidatePath("/system/users");
  return res;
}

export async function getSystemUsersPage(
  query: SystemUsersQuery = {}
): Promise<ApiResponse<SystemUsersPage | null>> {
  const page = Math.max(0, query.page ?? 0);
  const size = Math.min(100, Math.max(1, query.size ?? 20));
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (query.q?.trim()) params.set("q", query.q.trim());
  if (query.role) params.set("role", query.role);
  if (typeof query.active === "boolean") params.set("active", String(query.active));

  const res = await apiFetch<unknown>(`${SYSTEM_USERS_URL}?${params.toString()}`, {
    auth: "required",
    cache: "no-store",
  });
  if (!res.success) {
    return normalizeApiResponse(res, null);
  }
  const raw = (res.data ?? {}) as Record<string, unknown>;
  const pageData = (raw.data && typeof raw.data === "object" ? raw.data : raw) as Record<string, unknown>;
  const collection = pageData.content ?? pageData.items ?? pageData.users;
  const totalElements = Number(pageData.totalElements);
  const totalPages = Number(pageData.totalPages);
  const currentPage = Number(pageData.number ?? page);
  const currentSize = Number(pageData.size ?? size);
  if (
    !Array.isArray(collection) ||
    !Number.isInteger(totalElements) ||
    totalElements < 0 ||
    !Number.isInteger(totalPages) ||
    totalPages < 0 ||
    !Number.isInteger(currentPage) ||
    currentPage < 0 ||
    !Number.isInteger(currentSize) ||
    currentSize < 1
  ) {
    return {
      status: 502,
      success: false,
      message: "System users returned an invalid paginated response.",
      data: null,
      timestamp: new Date().toISOString(),
      requestId: res.requestId,
    };
  }
  const content = collection.map(normalizeUserRecord);
  return {
    ...res,
    data: {
      content,
      totalElements,
      totalPages,
      number: currentPage,
      size: currentSize,
    },
  };
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
