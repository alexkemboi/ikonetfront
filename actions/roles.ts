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

export async function getRolesAction(): Promise<ApiResponse<ApiRole[]>> {
  try {
    const res = await fetch(
      `${process.env.BASE_API_URL}system-setup/all-roles`,
      { headers: await getAuthHeaders(), cache: "no-store" }
    );
    return await res.json();
  } catch {
    return { status: 500, success: false, message: "Failed to fetch roles", data: null as unknown as ApiRole[], timestamp: "" };
  }
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
    revalidatePath("/settings/roles");
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
      revalidatePath("/settings/roles");
      revalidatePath("/settings/access");

      return { success: assignments.length, failed: 0 };
    }

    return { success: 0, failed: assignments.length };
  } catch {
    return { success: 0, failed: assignments.length };
  }
}
