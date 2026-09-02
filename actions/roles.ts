"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import type { ApiResponse } from "@/lib/types/auth";
import type { ApiRole, ApiMenuItem, ApiRoleUser, AddRolePayload, MenuAssignment } from "@/lib/types/roles";
import { apiFetch } from "@/lib/apiClient";
import { NAV_MENUS_TAG } from "@/lib/data/nav";

function normalizeRoleRecord(raw: unknown): ApiRole {
  const r = (raw ?? {}) as Record<string, unknown>;
  const roleCode = String(r.roleCode ?? r.role_code ?? r.code ?? r.id ?? "");
  return {
    idxno: Number(r.idxno ?? r.id ?? 0),
    roleCode: roleCode || String(r.idxno ?? r.id ?? ""),
    name: String(r.name ?? r.roleName ?? r.role_name ?? r.title ?? "Untitled role"),
    description: String(r.description ?? r.desc ?? ""),
    createdAt: String(r.createdAt ?? r.created_at ?? ""),
  };
}

/** Live-spec primary: `GET /system-setup/all-roles` (bearer). */
export async function getRolesAction(): Promise<ApiResponse<ApiRole[]>> {
  const res = await apiFetch<unknown[]>("/system-setup/all-roles", {
    auth: "required",
    cache: "no-store",
  });
  if (!res.success || !Array.isArray(res.data)) {
    return {
      status: res.status,
      success: false,
      message: res.message || "Failed to fetch roles",
      data: [],
      timestamp: res.timestamp,
    };
  }
  return {
    status: res.status,
    success: true,
    message: res.message,
    data: res.data.map(normalizeRoleRecord),
    timestamp: res.timestamp,
  };
}

export async function getAllMenusAction(): Promise<ApiResponse<ApiMenuItem[]>> {
  const res = await apiFetch<ApiMenuItem[]>("/system-setup/all-menus", {
    auth: "required",
    cache: "no-store",
  });
  return res.success && Array.isArray(res.data)
    ? { ...res, data: res.data }
    : { status: res.status, success: false, message: res.message || "Failed to fetch menus", data: [], timestamp: res.timestamp };
}

export async function getRoleMenusAction(
  roleCode: string
): Promise<ApiResponse<ApiMenuItem[]>> {
  const res = await apiFetch<ApiMenuItem[]>(`/system-setup/${roleCode}/menus`, {
    auth: "required",
    cache: "no-store",
  });
  return res.success && Array.isArray(res.data)
    ? { ...res, data: res.data }
    : { status: res.status, success: false, message: res.message || "Failed to fetch role menus", data: [], timestamp: res.timestamp };
}

export async function getRoleUsersAction(
  roleCode: string
): Promise<ApiResponse<ApiRoleUser[]>> {
  const res = await apiFetch<ApiRoleUser[]>(`/system-setup/${roleCode}/users`, {
    auth: "required",
    cache: "no-store",
  });
  return res.success && Array.isArray(res.data)
    ? { ...res, data: res.data }
    : { status: res.status, success: false, message: res.message || "Failed to fetch role users", data: [], timestamp: res.timestamp };
}

export async function addRoleAction(
  payload: AddRolePayload
): Promise<ApiResponse<ApiRole>> {
  const res = await apiFetch<ApiRole>("/system-setup/add-role", {
    method: "POST",
    body: payload,
    auth: "required",
    cache: "no-store",
  });
  if (res.success) {
    revalidatePath("/system/access");
  }
  return res;
}

/**
 * Save all menu permission assignments for a role in a single API call.
 * Sends POST with { permissions: [...] } — the API handles all items atomically.
 */
export async function saveRoleMenusAction(
  roleCode: string,
  assignments: MenuAssignment[]
): Promise<{ success: number; failed: number }> {
  const res = await apiFetch<unknown>(`/system-setup/${roleCode}/menus`, {
    method: "POST",
    auth: "required",
    body: { permissions: assignments },
  });

  if (res.success) {
    revalidateTag(NAV_MENUS_TAG, "max");
    revalidateTag(`${NAV_MENUS_TAG}-${roleCode}`, "max");
    revalidatePath("/system/access");
    return { success: assignments.length, failed: 0 };
  }

  return { success: 0, failed: assignments.length };
}

/**
 * Rename a role. Live spec: `PUT /system-setup/update-role/{id}` where `id`
 * is the role's numeric `idxno` (int64), body `UpdateRoleRequest`
 * `{ roleCode, name, description }`, response `ApiResponseRole` (bearer).
 */
export async function renameRoleAction(
  roleIdxno: number,
  roleCode: string,
  name: string,
  description: string
): Promise<ApiResponse<ApiRole>> {
  const res = await apiFetch<ApiRole>(`/system-setup/update-role/${roleIdxno}`, {
    method: "PUT",
    body: { roleCode, name, description },
    auth: "required",
    cache: "no-store",
  });
  if (res.success) {
    revalidatePath("/system/access");
  }
  return res;
}

/**
 * Role membership mutation — GATED.
 * `POST /system-setup/{roleCode}/users` / `DELETE .../{userId}` are absent from
 * the live spec (only `GET {roleCode}/users` exists). Return a readable 503
 * envelope instead of an optimistic call into a route that does not exist.
 */
export async function assignUserToRoleAction(
  roleCode: string,
  userId: string
): Promise<ApiResponse<null>> {
  void roleCode;
  void userId;
  return {
    status: 503,
    success: false,
    message:
      "Role membership assignment is pending the backend route (POST /system-setup/{roleCode}/users). Only GET {roleCode}/users is live.",
    data: null,
    timestamp: new Date().toISOString(),
  };
}

export async function removeUserFromRoleAction(
  roleCode: string,
  userId: string
): Promise<ApiResponse<null>> {
  void roleCode;
  void userId;
  return {
    status: 503,
    success: false,
    message:
      "Role membership removal is pending the backend route (DELETE /system-setup/{roleCode}/users/{userId}). Only GET {roleCode}/users is live.",
    data: null,
    timestamp: new Date().toISOString(),
  };
}