"use server";

import { auth } from "@/lib/auth";
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
  try {
    const response = await fetch(
      `${process.env.BASE_API_URL}system-setup/user/register`,
      {
        method:  "POST",
        headers: await getAuthHeaders(),
        body:    JSON.stringify(userData),
        cache:   "no-store",
      }
    );
    const result: ApiResponse<ApiRoleUser> = await response.json();
    if (result.success) {
      revalidatePath("/system/staff-users");
    }
    return result;
  } catch (error) {
    return {
      status:    500,
      success:   false,
      message:   (error instanceof Error ? error.message : String(error)) || "Unexpected error",
      data:      null as unknown as ApiRoleUser,
      timestamp: new Date().toISOString(),
    };
  }
}

export async function getSystemUsers(): Promise<ApiRoleUser[]> {
  try {
    const response = await fetch(`https://api.beesmartbedak.com/api/system/users/staff`,
      { headers: await getAuthHeaders(), cache: "no-store" }
    );
    
    const result = await response.json();
    console.log("Fetched system users:", result); // Debugging log
    return Array.isArray(result?.data) ? result.data : [];
  } catch {
    return [];
  }
}
