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

  const headers = await getAuthHeaders();
  const hasToken = Boolean((headers as Record<string, string>).Authorization);
  const roleCode = candidateUrls
    .map((url) => url.match(/system-setup\/([^/]+)\/users/)?.[1])
    .find(Boolean) ?? null;
  let lastStatus: number | undefined;
  let lastRequestId: string | undefined;

  for (const url of candidateUrls) {
    try {
      const fullUrl = buildApiUrl(url);
      const requestId = crypto.randomUUID();
      lastRequestId = requestId;
      const response = await fetch(fullUrl, {
        headers: { ...(headers as Record<string, string>), "X-Request-Id": requestId },
        cache: "no-store",
      });
      lastStatus = response.status;
      lastRequestId = response.headers.get("X-Request-Id") ?? requestId;

      if (!response.ok) {
        continue;
      }

      const text = await response.text();
      const result = text ? JSON.parse(text) : null;
      const users = extractUsersPayload(result);

      if (Array.isArray(users)) {
        return users.map(normalizeUserRecord);
      }

      if (result?.success === false) {
        continue;
      }
    } catch {
      lastStatus = undefined;
    }
  }

  console.error("[System Users] Failed to load users.", {
    hasToken,
    roleCode,
    status: lastStatus,
    requestId: lastRequestId,
  });
  return [];
}
