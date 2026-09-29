
"use server";

import { withCompanyContext } from "@/lib/companyContext";
import { revalidatePath } from "next/cache";
import {
  MikrotikDevice,
  MikrotikDeviceStatus,
  MikrotikInterface,
  AddMikrotikDevicePayload,
  ApiResponse,
} from "@/lib/types/mikrotik";
import { BASE_URL } from "@/lib/constants";
import { auth } from "@/lib/auth";
import { apiFetch } from "@/lib/apiClient";

async function getRlsScopeParams(): Promise<URLSearchParams> {
  const session = await auth();
  const params = new URLSearchParams();
  if (session?.user?.regionId)  params.append("regionId",  session.user.regionId.toString());
  if (session?.user?.stationId) params.append("stationId", session.user.stationId.toString());
  if (session?.user?.locationId) params.append("locationId", session.user.locationId.toString());
  return params;
}


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



export async function getMikrotikDevices(): Promise<
  ApiResponse<MikrotikDevice[]>
> {
  try {
    const params = await getRlsScopeParams();
    const res = await apiFetch<MikrotikDevice[]>(`/network-devices?${params.toString()}`, {
      auth: "required",
      tags: ["mikrotik-devices"],
    });
    return { ...res, data: res.data ?? [], error: res.message };
  } catch (error: unknown) {
    console.error("Error fetching MikroTik devices:", error);
    return {
      status: 500,
      success: false,
      message: (error instanceof Error ? error.message : String(error)) || "An unexpected error occurred",
      data: [],
      timestamp: new Date().toISOString(),
    };
  }
}

export async function addMikrotikDevice(
  payload: AddMikrotikDevicePayload
): Promise<ApiResponse<MikrotikDevice | null>> {
  try {
    const response = await fetch(`${BASE_URL}network-devices`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    

    if (!response.ok) {
      const errorData: unknown = await response.json();
      return {
        status: response.status,
        success: false,
        message: (errorData as { message?: string })?.message || "Failed to add MikroTik device",
        data: null,
        timestamp: new Date().toISOString(),
      };
    }

    const data: ApiResponse<MikrotikDevice> = await response.json();
    revalidatePath("/network/mikrotik"); // Revalidate the page to show the new device
    return data;
  } catch (error: unknown) {
    console.error("Error adding MikroTik device:", error);
    return {
      status: 500,
      success: false,
      message: (error instanceof Error ? error.message : String(error)) || "An unexpected error occurred",
      data: null,
      timestamp: new Date().toISOString(),
    };
  }
}

export async function getMikrotikDeviceStatus(
  id: number
): Promise<ApiResponse<MikrotikDeviceStatus | null>> {
  try {
    const res = await apiFetch<MikrotikDeviceStatus>(`/network-devices/${id}/status`, {
      auth: "required",
      tags: [`mikrotik-device-status-${id}`],
    });
    return { ...res, data: res.data, error: res.message };
  } catch (error: unknown) {
    console.error(`Error fetching status for device ${id}:`, error);
    return {
      status: 500,
      success: false,
      message: (error instanceof Error ? error.message : String(error)) || "An unexpected error occurred",
      data: null,
      timestamp: new Date().toISOString(),
    };
  }
}

export async function getMikrotikDeviceInterfaces(
  id: number
): Promise<ApiResponse<MikrotikInterface[]>> {
  try {
    const res = await apiFetch<MikrotikInterface[]>(`/network-devices/${id}/interfaces`, {
      auth: "required",
      tags: [`mikrotik-device-interfaces-${id}`],
    });
    return { ...res, data: res.data ?? [], error: res.message };
  } catch (error: unknown) {
    console.error(`Error fetching interfaces for device ${id}:`, error);
    return {
      status: 500,
      success: false,
      message: (error instanceof Error ? error.message : String(error)) || "An unexpected error occurred",
      data: [],
      timestamp: new Date().toISOString(),
    };
  }
}
