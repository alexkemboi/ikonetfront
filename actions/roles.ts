"use server";

import { withCompanyContext } from "@/lib/companyContext";
import { revalidatePath, updateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { buildApiUrl } from "@/lib/constants";
import type { ApiResponse } from "@/lib/types/auth";
import type { ApiRole, ApiMenuItem, ApiRoleUser, AddRolePayload, UpdateRolePayload, MenuAssignment, NavLayoutRow } from "@/lib/types/roles";
import { NAV_MENUS_TAG } from "@/lib/data/nav";

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

function normalizeRoleRecord(raw: unknown): ApiRole {
  const r = (raw ?? {}) as Record<string, unknown>;
  const roleCode = String(r.roleCode ?? r.role_code ?? r.code ?? r.id ?? "");
  return {
    idxno: Number(r.idxno ?? r.id ?? 0),
    roleCode: roleCode || String(r.idxno ?? r.id ?? ""),
    name: String(r.name ?? r.roleName ?? r.role_name ?? r.title ?? "Untitled role"),
    description: String(r.description ?? r.desc ?? ""),
    createdAt: String(r.createdAt ?? r.created_at ?? ""),
    // what the role is, from the roles table (screens decide by these, never by the role's name)
    roleKey: (r.roleKey ?? r.role_key ?? null) as string | null,
    principalType: (r.principalType ?? r.principal_type ?? null) as string | null,
    scopeLevel: (r.scopeLevel ?? r.scope_level ?? null) as string | null,
    isSystem: Boolean(r.isSystem ?? r.is_system),
    isSuperAdmin: Boolean(r.isSuperAdmin ?? r.is_super_admin),
    isActive: (r.isActive ?? r.is_active) !== false,
    landingRoute: (r.landingRoute ?? r.landing_route ?? null) as string | null,
    updatedAt: (r.updatedAt ?? r.updated_at ?? null) as string | null,
  };
}

function extractCollection(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const obj = payload as Record<string, unknown> | null;
  if (obj?.data && Array.isArray(obj.data)) return obj.data;
  if (obj?.items && Array.isArray(obj.items)) return obj.items;
  if (obj?.roles && Array.isArray(obj.roles)) return obj.roles;
  if (obj?.content && Array.isArray(obj.content)) return obj.content;
  return [];
}

export async function getRolesAction(): Promise<ApiResponse<ApiRole[]>> {
  const candidateUrls = [
    "/system-setup/all-roles",
    "/system-setup/roles",
    "/system/roles",
  ];

  let lastError = "Failed to fetch roles";

  for (const url of candidateUrls) {
    try {
      const res = await fetch(buildApiUrl(url), {
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
      buildApiUrl("/system-setup/all-menus"),
      { headers: await getAuthHeaders(), cache: "no-store" }
    );
    return await res.json();
  } catch {
    return { status: 500, success: false, message: "Failed to fetch menus", data: null as unknown as ApiMenuItem[], timestamp: "" };
  }
}

/**
 * The sidebar layout (GET /navigation/menus), so Access Control can list screens the way the
 * sidebar shows them. Read-only: no cache tags are touched (it runs while the page renders).
 */
export async function getNavigationLayoutAction(): Promise<NavLayoutRow[]> {
  try {
    const res = await fetch(buildApiUrl("/navigation/menus"), { headers: await getAuthHeaders(), cache: "no-store" });
    const data: ApiResponse<NavLayoutRow[]> = await res.json();
    return data.success && Array.isArray(data.data) ? data.data : [];
  } catch {
    return [];
  }
}

export async function getRoleMenusAction(
  roleCode: string
): Promise<ApiResponse<ApiMenuItem[]>> {
  try {
    const res = await fetch(
      buildApiUrl(`/system-setup/${roleCode}/menus`),
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
      buildApiUrl(`/system-setup/${roleCode}/users`),
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
    buildApiUrl("/system-setup/add-role"),
    {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify(payload),
      cache: "no-store",
    }
  );
  const data: ApiResponse<ApiRole> = await res.json();
  if (data.success) {
    revalidatePath("/system/users/roles");
  }
  return data;
}

async function roleRequest<T>(path: string, method: string, body?: unknown): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(buildApiUrl(path), {
      method,
      headers: await getAuthHeaders(),
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
    const data: ApiResponse<T> = await res.json();
    if (data.success) {
      // role changes alter who sees which menus: expire the cached menus at once
      updateTag(NAV_MENUS_TAG);
      revalidatePath("/system/users/roles");
      revalidatePath("/system/users");
    }
    return data;
  } catch {
    return { success: false, status: 0, message: "Could not reach the server." } as ApiResponse<T>;
  }
}

/** Change a role's name, description, type, scope, landing page, active state or assigners. */
export async function updateRoleAction(idxno: number, roleCode: string, payload: UpdateRolePayload): Promise<ApiResponse<ApiRole>> {
  return roleRequest<ApiRole>(`/system-setup/update-role/${idxno}`, "PUT", { roleCode, ...payload });
}

/** Copy a role (type, scope and every grant) under a new code and name. */
export async function duplicateRoleAction(idxno: number, roleCode: string, name: string): Promise<ApiResponse<ApiRole>> {
  return roleRequest<ApiRole>(`/system-setup/roles/${idxno}/duplicate`, "POST", { roleCode, name });
}

/** Delete a custom role that no user holds. */
export async function deleteRoleAction(idxno: number): Promise<ApiResponse<null>> {
  return roleRequest<null>(`/system-setup/roles/${idxno}`, "DELETE");
}

/** Codes of the roles that may assign this role (besides the super admin). */
export async function getRoleAssignersAction(idxno: number): Promise<string[]> {
  const res = await roleRequest<string[]>(`/system-setup/roles/${idxno}/assigners`, "GET");
  return res.success && Array.isArray(res.data) ? res.data : [];
}

/**
 * Save all menu permission assignments for a role in a single API call.
 * Sends POST with { permissions: [...] } — the API handles all items atomically.
 */
export async function saveRoleMenusAction(
  roleCode: string,
  assignments: MenuAssignment[]
): Promise<{ success: number; failed: number; message?: string }> {
  const headers = await getAuthHeaders();
  const url = buildApiUrl(`/system-setup/${roleCode}/menus`);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ permissions: assignments }),
      cache: "no-store",
    });

    const data: ApiResponse<unknown> = await res.json();

    if (data.success) {
      // updateTag expires the cached menus at once, so every account of this role gets the new
      // sidebar on its next page load (revalidateTag(…, 'max') served the old one once more)
      updateTag(NAV_MENUS_TAG);
      updateTag(`${NAV_MENUS_TAG}-${roleCode}`);
      revalidatePath("/system/users/roles");

      return { success: assignments.length, failed: 0 };
    }

    return { success: 0, failed: assignments.length, message: data.message };
  } catch {
    return { success: 0, failed: assignments.length };
  }
}
