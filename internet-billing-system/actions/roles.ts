"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import type { ApiResponse } from "@/lib/types/auth";
import type { ApiRole, RoleMenu, AddRolePayload } from "@/lib/types/roles";

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
): Promise<ApiResponse<RoleMenu[]>> {
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
