"use server";

import { auth } from "@/lib/auth";
import { buildApiUrl } from "@/lib/constants";
import { revalidatePath } from "next/cache";
import type { ApiRoleUser } from "@/lib/types/roles";
import type { ApiResponse } from "@/lib/types/auth";

async function getAuthHeaders(): Promise<HeadersInit> {
  const session = await auth();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (session?.user?.apiToken) {
    (headers as Record<string, string>)["Authorization"] =
      `Bearer ${session.user.apiToken}`;
  }
  return headers;
}

function normalizeUserRecord(raw: any): ApiRoleUser {
  return {
    idxno: Number(raw?.idxno ?? raw?.userIdxno ?? raw?.id ?? 0),
    username: String(raw?.username ?? raw?.userName ?? raw?.name ?? ""),
    userId: String(raw?.userId ?? raw?.user_id ?? raw?.id ?? raw?.idxno ?? ""),
    role: String(raw?.role ?? raw?.roleCode ?? ""),
    roleName: String(raw?.roleName ?? raw?.role_name ?? raw?.role ?? ""),
    createdAt: String(raw?.createdAt ?? raw?.created_at ?? ""),
    isactive: Boolean(raw?.isactive ?? raw?.isActive ?? true),
    fname: String(raw?.fname ?? raw?.firstName ?? raw?.first_name ?? ""),
    middleName: String(raw?.middleName ?? raw?.middle_name ?? ""),
    otherName: String(raw?.otherName ?? raw?.other_name ?? ""),
    fullName: String(raw?.fullName ?? raw?.full_name ?? [raw?.fname, raw?.middleName, raw?.otherName].filter(Boolean).join(" ") ?? ""),
    email: String(raw?.email ?? ""),
    phoneNumber: String(raw?.phoneNumber ?? raw?.phone_number ?? ""),
    canLogin: Boolean(raw?.canLogin ?? raw?.can_login ?? true),
  };
}

function extractUsersPayload(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.users)) return payload.users;
  if (Array.isArray(payload?.content)) return payload.content;
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

export async function addSystemUser(
  userData: UserData
): Promise<ApiResponse<ApiRoleUser>> {
  const payload = {
    ...userData,
    roleCode: userData.role,
    role: userData.role,
  };

  const candidateUrls = [
    "/system-setup/user/register",
    "/system-setup/register-user",
    "/system/users/register",
    "/system/users/staff",
  ];

  let lastError: unknown = null;

  for (const url of candidateUrls) {
    try {
      const response = await fetch(buildApiUrl(url), {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify(payload),
        cache: "no-store",
      });

      const text = await response.text();
      const result = text ? JSON.parse(text) : null;

      if (response.ok) {
        if (result?.success === false) {
          const errorMessage = result?.message || "User creation failed";
          return {
            status: response.status,
            success: false,
            message: errorMessage,
            data: null as unknown as ApiRoleUser,
            timestamp: new Date().toISOString(),
          };
        }

        if (result?.success || result?.data || result?.message) {
          revalidatePath("/system/users");
          return {
            status: response.status,
            success: true,
            message: result?.message || "User created successfully",
            data: normalizeUserRecord(result?.data ?? payload),
            timestamp: new Date().toISOString(),
          };
        }
      }

      lastError = new Error(result?.message || `Request failed with status ${response.status}`);
    } catch (error) {
      lastError = error;
    }
  }

  return {
    status: 500,
    success: false,
    message: lastError instanceof Error ? lastError.message : "Unexpected error while creating system user",
    data: null as unknown as ApiRoleUser,
    timestamp: new Date().toISOString(),
  };
}

export async function getSystemUsers(): Promise<ApiRoleUser[]> {
  const candidateUrls = [
    "/system/users/staff",
    "/system/users",
    "/system-setup/03/users",
    "/system-setup/all-users",
  ];

  let lastError: unknown = null;

  for (const url of candidateUrls) {
    try {
      const response = await fetch(buildApiUrl(url), {
        headers: await getAuthHeaders(),
        cache: "no-store",
      });

      if (!response.ok) {
        lastError = new Error(`Request failed with status ${response.status}`);
        continue;
      }

      const text = await response.text();
      const result = text ? JSON.parse(text) : null;
      const users = extractUsersPayload(result);

      if (Array.isArray(users)) {
        return users.map(normalizeUserRecord);
      }

      if (result?.success === false) {
        throw new Error(result?.message || "Failed to fetch system users");
      }
    } catch (error) {
      lastError = error;
    }
  }

  console.error("[System Users] Failed to load users from all configured endpoints:", lastError);
  return [];
}
