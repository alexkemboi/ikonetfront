
"use server";

import { revalidatePath } from "next/cache";
import {
  MikrotikDevice,
  MikrotikDeviceStatus,
  MikrotikInterface,
  AddMikrotikDevicePayload,
  ApiResponse,
} from "@/lib/types/mikrotik";

const BASE_URL = "https://beesmartbedak.com/api/v1";

export async function getMikrotikDevices(): Promise<
  ApiResponse<MikrotikDevice[]>
> {
  try {
    const response = await fetch(`${BASE_URL}/network-devices`, {
      next: {
        tags: ["mikrotik-devices"],
      },
    });
    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      let errorData: unknown;
      if (contentType && contentType.includes('application/json')) {
        errorData = await response.json();
      } else {
        errorData = await response.text(); // Read as text if not JSON
      }
      return {
        status: response.status,
        success: false,
        data: [],
        timestamp: new Date().toISOString(),
        message: typeof errorData === 'string' ? errorData : (errorData as { message?: string })?.message || 'Failed to fetch MikroTik devices',
        error: (errorData as { message?: string })?.message || String(errorData) || 'An unknown error occurred',
      };
    }
    const data: ApiResponse<MikrotikDevice[]> = await response.json();
    return data;
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
    const response = await fetch(`${BASE_URL}/network-devices`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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
    revalidatePath("/network/microtick"); // Revalidate the page to show the new device
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
    const response = await fetch(`${BASE_URL}/network-devices/${id}/status`, {
      next: {
        tags: [`mikrotik-device-status-${id}`],
      },
    });
    if (!response.ok) {
      const errorData: unknown = await response.json();
      return {
        status: response.status,
        success: false,
        message: (errorData as { message?: string })?.message || "Failed to fetch device status",
        data: null,
        timestamp: new Date().toISOString(),
      };
    }
    const data: ApiResponse<MikrotikDeviceStatus> = await response.json();
    return data;
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
    console.log(`Fetching interfaces for device ${ BASE_URL } / network - devices / ${ id } / interfaces...`);
    const response = await fetch(
      `${BASE_URL}/network-devices/${id}/interfaces`,
      {
        next: {
          tags: [`mikrotik-device-interfaces-${id}`],
        },
      }
    );
    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      let errorData: unknown;
      if (contentType && contentType.includes('application/json')) {
        errorData = await response.json();
      } else {
        errorData = await response.text(); // Read as text if not JSON
      }
      return {
        status: response.status,
        success: false,
        message: typeof errorData === 'string' ? errorData : (errorData as { message?: string })?.message || 'Failed to fetch device interfaces',
        data: [],
        timestamp: new Date().toISOString(),
        error: (errorData as { message?: string })?.message || String(errorData) || 'An unknown error occurred',
      };
    }
    const data: ApiResponse<MikrotikInterface[]> = await response.json();
    return data;
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
