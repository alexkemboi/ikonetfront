"use server";

import { revalidatePath } from "next/cache";
import type { ApiRoleUser } from "@/lib/types/roles";
import type { ApiResponse } from "@/lib/types/auth";
import { apiFetch } from "@/lib/apiClient";

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

/**
 * Create a system user. Live spec: `POST /system-setup/user/register`
 * (`RegisterRequest`, bearer) — the ONLY live registration route.
 */
export async function addSystemUser(
  userData: UserData
): Promise<ApiResponse<ApiRoleUser>> {
  const payload = {
    ...userData,
    roleCode: userData.role,
    role: userData.role,
  };

  const res = await apiFetch<ApiRoleUser>("/system-setup/user/register", {
    method: "POST",
    body: payload,
    auth: "required",
    cache: "no-store",
  });

  if (!res.success) {
    return {
      status: res.status,
      success: false,
      message: res.message || "User creation failed",
      data: null as unknown as ApiRoleUser,
      timestamp: res.timestamp,
    };
  }

  revalidatePath("/system/users");
  return {
    status: res.status,
    success: true,
    message: res.message || "User created successfully",
    data: normalizeUserRecord(res.data),
    timestamp: res.timestamp,
  };
}

/**
 * Fetch staff/system users. Live spec: `GET /system/users/staff` (bearer) —
 * the ONLY live listing route.
 */
export async function getSystemUsers(): Promise<ApiRoleUser[]> {
  const res = await apiFetch<ApiRoleUser[]>("/system/users/staff", {
    auth: "required",
    cache: "no-store",
  });
  if (!res.success || !Array.isArray(res.data)) {
    return [];
  }
  return res.data.map(normalizeUserRecord);
}