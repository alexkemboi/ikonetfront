"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import type { ApiResponse } from "@/lib/types/auth";
import type { ApiRole, ApiMenuItem, AddRolePayload, MenuAssignment } from "@/lib/types/roles";
import { NAV_MENUS_TAG } from "@/lib/data/nav";

/** Number of assignment calls to fire in parallel per batch */
const BATCH_SIZE = 5;

async function getAuthHeaders(): Promise<HeadersInit> {
  const session = await auth();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (session?.user?.apiToken) {
    (headers as Record<string, string>)["Authorization"] =
      `Bearer ${session.user.apiToken}`;
  }
  return headers;
}

export async function getRolesAction(): Promise<ApiResponse<ApiRole[]>> {
  const res = await fetch(
    `${process.env.BASE_API_URL}system-setup/all-roles`,
    { headers: await getAuthHeaders(), cache: "no-store" }
  );
  return res.json();
}

export async function getRoleMenusAction(
  roleCode: string
): Promise<ApiResponse<ApiMenuItem[]>> {
  const res = await fetch(
    `${process.env.BASE_API_URL}system-setup/${roleCode}/menus`,
    { headers: await getAuthHeaders(), cache: "no-store" }
  );
  return res.json();
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
 * Save all menu permission assignments for a role.
 *
 * Sends one POST per menu item. To avoid overwhelming the server:
 * - Splits into chunks of BATCH_SIZE (5)
 * - Each chunk runs in parallel with Promise.allSettled
 * - Chunks run sequentially — so max 5 concurrent requests at any time
 * - A single item failure does NOT abort the rest
 *
 * After all batches complete, invalidates the nav-menus cache so the
 * sidebar and roles page reflect the new permissions immediately.
 *
 * Returns { success, failed } counts so the client can show a granular toast.
 */
export async function saveRoleMenusAction(
  roleCode: string,
  assignments: MenuAssignment[]
): Promise<{ success: number; failed: number }> {
  const headers = await getAuthHeaders();
  const url = `${process.env.BASE_API_URL}system-setup/${roleCode}/menus`;

  let success = 0;
  let failed  = 0;

  for (let i = 0; i < assignments.length; i += BATCH_SIZE) {
    const batch = assignments.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map((assignment) =>
        fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify(assignment),
          cache: "no-store",
        }).then((r) => r.json() as Promise<ApiResponse<unknown>>)
      )
    );

    for (const result of results) {
      if (result.status === "fulfilled" && result.value?.success) {
        success++;
      } else {
        failed++;
      }
    }
  }

  // Revalidate so sidebar + roles page show updated permissions
  if (success > 0) {
    revalidateTag(NAV_MENUS_TAG, 'max');
    revalidatePath("/settings/roles");
  }

  return { success, failed };
}
