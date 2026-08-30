"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import type { ApiResponse } from "@/lib/types/auth";
import type { ApiRole, ApiMenuItem, ApiRoleUser, AddRolePayload, MenuAssignment } from "@/lib/types/roles";
import { NAV_MENUS_TAG } from "@/lib/data/nav";

async function getAuthHeaders(): Promise<HeadersInit> {
  const session = await auth();
  console.log("Current session in getAuthHeaders:", session?.user?.apiToken);
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (session?.user?.apiToken) {
    (headers as Record<string, string>)["Authorization"] =
      `Bearer ${session.user.apiToken}`;
  }
  return headers;
}

function normalizeRoleRecord(raw: any): ApiRole {
  const roleCode = String(raw?.roleCode ?? raw?.role_code ?? raw?.code ?? raw?.id ?? "");
  return {
    idxno: Number(raw?.idxno ?? raw?.id ?? 0),
    roleCode: roleCode || String(raw?.idxno ?? raw?.id ?? ""),
    name: String(raw?.name ?? raw?.roleName ?? raw?.role_name ?? raw?.title ?? "Untitled role"),
    description: String(raw?.description ?? raw?.desc ?? ""),
    createdAt: String(raw?.createdAt ?? raw?.created_at ?? ""),
  };
}

function extractCollection(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.roles)) return payload.roles;
  if (Array.isArray(payload?.content)) return payload.content;
  return [];
}

export async function getRolesAction(): Promise<ApiResponse<ApiRole[]>> {
  const candidateUrls = [
    `${process.env.BASE_API_URL}system-setup/all-roles`,
    `${process.env.BASE_API_URL}system-setup/roles`,
    `${process.env.BASE_API_URL}system/roles`,
  ];

  let lastError = "Failed to fetch roles";

  for (const url of candidateUrls) {
    try {
      const res = await fetch(url, {
        headers: await getAuthHeaders(),
        cache: "no-store",
      });

      if (!res.ok) {
        lastError = `Failed to fetch roles (${res.status})`;
        continue;
      }

      const payload = await res.json();
      const collection = extractCollection(payload);

      if (collection.length > 0) {
        return {
          status: res.status,
          success: true,
          message: payload?.message || "Roles fetched successfully",
          data: collection.map(normalizeRoleRecord),
          timestamp: new Date().toISOString(),
        };
      }

      if (payload?.success === false) {
        lastError = payload?.message || lastError;
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Failed to fetch roles";
    }
  }

  return {
    status: 500,
    success: false,
    message: lastError,
    data: [],
    timestamp: new Date().toISOString(),
  };
}

export async function getAllMenusAction(): Promise<ApiResponse<ApiMenuItem[]>> {
  try {
    const res = await fetch(
      `${process.env.BASE_API_URL}system-setup/all-menus`,
      { headers: await getAuthHeaders(), cache: "no-store" }
    );
    return await res.json();
  } catch {
    return { status: 500, success: false, message: "Failed to fetch menus", data: null as unknown as ApiMenuItem[], timestamp: "" };
  }
}

export async function getRoleMenusAction(
  roleCode: string
): Promise<ApiResponse<ApiMenuItem[]>> {
  try {
    const res = await fetch(
      `${process.env.BASE_API_URL}system-setup/${roleCode}/menus`,
      { headers: await getAuthHeaders(), cache: "no-store" }
    );
    return await res.json();
  } catch {
    return { status: 500, success: false, message: "Failed to fetch role menus", data: null as unknown as ApiMenuItem[], timestamp: "" };
  }
}

export async function getRoleUsersAction(
  roleCode: string
): Promise<ApiResponse<ApiRoleUser[]>> {
  try {
    const res = await fetch(
      `${process.env.BASE_API_URL}system-setup/${roleCode}/users`,
      { headers: await getAuthHeaders(), cache: "no-store" }
    );
    return await res.json();
  } catch {
    return { status: 500, success: false, message: "Failed to fetch role users", data: null as unknown as ApiRoleUser[], timestamp: "" };
  }
}

export async function addRoleAction(
  payload: AddRolePayload
): Promise<ApiResponse<ApiRole>> {
  const res = await fetch(
    `${process.env.BASE_API_URL}system-setup/add-role`,
    {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify(payload),
      cache: "no-store",
    }
  );
  const data: ApiResponse<ApiRole> = await res.json();
  if (data.success) {
    revalidatePath("/system/access");
  }
  return data;
}

/**
 * Save all menu permission assignments for a role in a single API call.
 * Sends POST with { permissions: [...] } — the API handles all items atomically.
 */
export async function saveRoleMenusAction(
  roleCode: string,
  assignments: MenuAssignment[]
): Promise<{ success: number; failed: number }> {
  const headers = await getAuthHeaders();
  const url = `${process.env.BASE_API_URL}system-setup/${roleCode}/menus`;

  console.log("Saving role menus:", { roleCode, assignments, url, headers });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ permissions: assignments }),
      cache: "no-store",
    });

    const data: ApiResponse<unknown> = await res.json();

    if (data.success) {
      revalidateTag(NAV_MENUS_TAG, 'max');
      revalidateTag(`${NAV_MENUS_TAG}-${roleCode}`, 'max');
      revalidatePath("/system/access");

      return { success: assignments.length, failed: 0 };
    }

    return { success: 0, failed: assignments.length };
  } catch {
    return { success: 0, failed: assignments.length };
  }
}

export async function renameRoleAction(
  roleCode: string,
  name: string,
  description: string
): Promise<ApiResponse<ApiRole>> {
  try {
    const res = await fetch(
      `${process.env.BASE_API_URL}system-setup/update-role/${roleCode}`,
      {
        method: "PUT",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ roleCode, name, description }),
        cache: "no-store",
      }
    );
    const data: ApiResponse<ApiRole> = await res.json();
    if (data.success) {
      revalidatePath("/system/access");
    }
    return data;
  } catch {
    return { status: 500, success: false, message: "Failed to rename role", data: null as unknown as ApiRole, timestamp: "" };
  }
}

export async function assignUserToRoleAction(
  roleCode: string,
  userId: string
): Promise<ApiResponse<null>> {
  try {
    const res = await fetch(
      `${process.env.BASE_API_URL}system-setup/${roleCode}/users`,
      {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ userId }),
        cache: "no-store",
      }
    );
    const data: ApiResponse<null> = await res.json();
    if (data.success) {
      revalidatePath("/system/access");
    }
    return data;
  } catch {
    return { status: 500, success: false, message: "Failed to assign user", data: null, timestamp: "" };
  }
}

export async function removeUserFromRoleAction(
  roleCode: string,
  userId: string
): Promise<ApiResponse<null>> {
  try {
    const res = await fetch(
      `${process.env.BASE_API_URL}system-setup/${roleCode}/users/${userId}`,
      {
        method: "DELETE",
        headers: await getAuthHeaders(),
        cache: "no-store",
      }
    );
    const data: ApiResponse<null> = await res.json();
    if (data.success) {
      revalidatePath("/system/access");
    }
    return data;
  } catch {
    return { status: 500, success: false, message: "Failed to remove user", data: null, timestamp: "" };
  }
}
