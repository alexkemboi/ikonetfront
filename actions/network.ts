"use server";

import {
  ApiResponse,
  NetworkRouter,
  RouterActionRequest,
  RouterActionResponse,
  RouterConfigRequest,
  TopologyNode,
} from "@/lib/types/network-router";
import type { ApiResponse as AuthApiResponse } from "@/lib/types/auth";
import {
  RegionRequest,
  RegionResponse,
  LocationRequest,
  LocationResponse,
  StationRequest,
  StationResponse,
  RouterConnectionRequest,
  RouterValidationResponse,
  RouterOnboardRequest,
  RouterHealthSnapshot,
  RouterCapacityResponse,
  SubscriberProvisioningRequest,
  RouterResponse,
} from "@/lib/types/network";
import { revalidatePath, revalidateTag, updateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { getPermissionForRoute } from "@/lib/data/nav";
import type { IpMappingResponse, IpPool, PageResponse } from "@/lib/types/api";
import { apiFetch } from "@/lib/apiClient";

async function getRlsScopeParams(): Promise<URLSearchParams> {
  const session = await auth();
  const params = new URLSearchParams();
  if (session?.user?.regionId)  params.append("regionId",  session.user.regionId.toString());
  if (session?.user?.stationId) params.append("stationId", session.user.stationId.toString());
  if (session?.user?.locationId) params.append("locationId", session.user.locationId.toString());
  return params;
}

export const getPendingRouters = async (): Promise<ApiResponse<NetworkRouter[]>> => {
  const params = await getRlsScopeParams();
  const res = await apiFetch<NetworkRouter[]>(
    `/network-routers/pending${params.toString() ? `?${params.toString()}` : ""}`,
    { auth: "required", tags: ["pending-routers"] }
  );
  return res.success && Array.isArray(res.data)
    ? res
    : { success: false, message: res.message || "Failed to fetch pending routers", data: [], status: res.status, timestamp: res.timestamp };
};

export const getTopologyTree = async (): Promise<ApiResponse<TopologyNode[]>> => {
  const res = await apiFetch<TopologyNode[]>("/network-routers/topology", {
    auth: "required",
    tags: ["router-topology"],
  });
  return res.success && Array.isArray(res.data)
    ? res
    : { success: false, message: res.message || "Failed to fetch topology", data: [], status: res.status, timestamp: res.timestamp };
};

export const getRouterDetails = async (id: number): Promise<ApiResponse<NetworkRouter | null>> => {
  const res = await apiFetch<NetworkRouter>(`/network-routers/${id}`, {
    auth: "required",
    tags: [`router-${id}`],
  });
  return res.success && res.data
    ? res
    : { success: false, message: res.message || "Failed to fetch router details", data: null, status: res.status, timestamp: res.timestamp };
};

export const finalizeRouter = async (
  id: number,
  body: RouterConfigRequest
): Promise<ApiResponse<NetworkRouter | null>> => {
  const res = await apiFetch<NetworkRouter>(`/network-routers/${id}/finalize`, {
    method: "POST",
    body,
    auth: "required",
  });
  if (res.success) {
    revalidatePath("/network/routers");
    updateTag("pending-routers");
    return { success: true, message: "Router finalized successfully", data: res.data, status: res.status, timestamp: res.timestamp };
  }
  return { success: false, message: res.message || "Failed to finalize router", data: null, status: res.status, timestamp: res.timestamp };
};

export const updateRouter = async (
  id: number,
  body: RouterConfigRequest
): Promise<ApiResponse<NetworkRouter | null>> => {
  const res = await apiFetch<NetworkRouter>(`/network-routers/${id}`, {
    method: "PATCH",
    body,
    auth: "required",
  });
  if (res.success) {
    updateTag(`router-${id}`);
    revalidatePath("/network/routers");
    return { success: true, message: "Router updated successfully", data: res.data, status: res.status, timestamp: res.timestamp };
  }
  return { success: false, message: res.message || "Failed to update router", data: null, status: res.status, timestamp: res.timestamp };
};

export const executeRouterAction = async (
  id: number,
  body: RouterActionRequest
): Promise<ApiResponse<RouterActionResponse | null>> => {
  const res = await apiFetch<RouterActionResponse>(`/network-routers/${id}/action`, {
    method: "PATCH",
    body,
    auth: "required",
  });
  return res.success && res.data
    ? res
    : { success: false, message: res.message || "Failed to execute action", data: null, status: res.status, timestamp: res.timestamp };
};

// ── Region actions ────────────────────────────────────────────────────────

export const getRegions = async (tree?: boolean): Promise<RegionResponse[]> => {
  const params = await getRlsScopeParams();
  if (tree) params.append("tree", "true");
  const res = await apiFetch<RegionResponse[]>(
    `/network/regions${params.toString() ? `?${params.toString()}` : ""}`,
    { auth: "required", cache: "no-store" }
  );
  return res.success && Array.isArray(res.data) ? res.data : [];
};

export const createRegion = async (
  request: RegionRequest
): Promise<AuthApiResponse<RegionResponse>> => {
  const res = await apiFetch<RegionResponse>("/network/regions", {
    method: "POST",
    body: request,
    auth: "required",
  });
  if (res.success) revalidateTag("network:regions", "max");
  return {
    success: res.success,
    message: res.message || (res.success ? "Region created successfully" : "Failed to create region"),
    data: res.success ? res.data : null,
    status: res.status,
    timestamp: res.timestamp,
  };
};

export const deleteRegion = async (
  id: number
): Promise<AuthApiResponse<void>> => {
  const res = await apiFetch<null>(`/network/regions/${id}`, {
    method: "DELETE",
    auth: "required",
  });
  if (res.success) revalidateTag("network:regions", "max");
  return {
    success: res.success,
    message: res.message || (res.success ? "Region deleted successfully" : "Failed to delete region"),
    data: res.success ? undefined : null,
    status: res.status,
    timestamp: res.timestamp,
  };
};

// ── Location actions ──────────────────────────────────────────────────────

export const getLocationsByRegion = async (regionIdxno: number): Promise<LocationResponse[]> => {
  const params = await getRlsScopeParams();
  const res = await apiFetch<LocationResponse[]>(
    `/network/locations/region/${regionIdxno}${params.toString() ? `?${params.toString()}` : ""}`,
    { auth: "required", cache: "no-store" }
  );
  return res.success && Array.isArray(res.data) ? res.data : [];
};

export const createLocation = async (
  request: LocationRequest
): Promise<AuthApiResponse<LocationResponse>> => {
  const res = await apiFetch<LocationResponse>("/network/locations", {
    method: "POST",
    body: request,
    auth: "required",
  });
  if (res.success) {
    updateTag(`network:locations:region:${request.regionIdxno}`);
    updateTag("network:regions");
  }
  return {
    success: res.success,
    message: res.message || (res.success ? "Location created successfully" : "Failed to create location"),
    data: res.success ? res.data : null,
    status: res.status,
    timestamp: res.timestamp,
  };
};

export const deleteLocation = async (
  id: number,
  regionIdxno: number
): Promise<AuthApiResponse<void>> => {
  const res = await apiFetch<null>(`/network/locations/${id}`, {
    method: "DELETE",
    auth: "required",
  });
  if (res.success) {
    updateTag(`network:locations:region:${regionIdxno}`);
    updateTag("network:regions");
  }
  return {
    success: res.success,
    message: res.message || (res.success ? "Location deleted successfully" : "Failed to delete location"),
    data: res.success ? undefined : null,
    status: res.status,
    timestamp: res.timestamp,
  };
};

// ── Station actions ───────────────────────────────────────────────────────

export const getStationsByLocation = async (locationIdxno: number): Promise<StationResponse[]> => {
  const params = await getRlsScopeParams();
  const res = await apiFetch<StationResponse[]>(
    `/network/stations/location/${locationIdxno}${params.toString() ? `?${params.toString()}` : ""}`,
    { auth: "required", cache: "no-store" }
  );
  return res.success && Array.isArray(res.data) ? res.data : [];
};

export const createStation = async (
  request: StationRequest
): Promise<AuthApiResponse<StationResponse>> => {
  const res = await apiFetch<StationResponse>("/network/stations", {
    method: "POST",
    body: request,
    auth: "required",
  });
  if (res.success) {
    updateTag(`network:stations:location:${request.locationIdxno}`);
    updateTag("network:regions");
  }
  return {
    success: res.success,
    message: res.message || (res.success ? "Station created successfully" : "Failed to create station"),
    data: res.success ? res.data : null,
    status: res.status,
    timestamp: res.timestamp,
  };
};

export const deleteStation = async (
  id: number,
  locationIdxno: number
): Promise<AuthApiResponse<void>> => {
  const res = await apiFetch<null>(`/network/stations/${id}`, {
    method: "DELETE",
    auth: "required",
  });
  if (res.success) {
    updateTag(`network:stations:location:${locationIdxno}`);
    updateTag("network:regions");
  }
  return {
    success: res.success,
    message: res.message || (res.success ? "Station deleted successfully" : "Failed to delete station"),
    data: res.success ? undefined : null,
    status: res.status,
    timestamp: res.timestamp,
  };
};

export const validateRouterConnectivity = async (
  request: RouterConnectionRequest
): Promise<ApiResponse<RouterValidationResponse>> => {
  try {
    return await apiFetch<RouterValidationResponse>("/network/routers/validate-connectivity", {
      method: "POST",
      body: request,
      auth: "required",
    });
  } catch (error: unknown) {
    return {
      status: 500,
      success: false,
      message: error instanceof Error ? error.message : "Failed to establish hardware API connection on port 8728",
      data: null as unknown as RouterValidationResponse,
      timestamp: new Date().toISOString(),
    };
  }
};

export const onboardRouter = async (
  request: RouterOnboardRequest
): Promise<ApiResponse<unknown>> => {
  try {
    const res = await apiFetch<unknown>("/network/routers/onboard", {
      method: "POST",
      body: request,
      auth: "required",
    });

    if (res.success) {
      revalidateTag("network:regions", "page");
    }
    return res;
  } catch (error: unknown) {
    return {
      status: 500,
      success: false,
      message: error instanceof Error ? error.message : "Failed to finalize database onboarding registration",
      data: null,
      timestamp: new Date().toISOString(),
    };
  }
};

export const getRouterHistory = async (
  routerId: number,
  size: number = 30
): Promise<RouterHealthSnapshot[]> => {
  try {
    // Contract (verified 2026-08-29): `GET /api/v1/network/monitoring/router/{routerId}/history`
    // paginates via `?page=&size=` and returns `ApiResponse<Page<RouterHealthSnapshot>>`
    // (NOT a bare array and NOT a `limit` param). Unwrap `data.content`.
    const res = await apiFetch<PageResponse<RouterHealthSnapshot>>(
      `/network/monitoring/router/${routerId}/history?page=0&size=${size}`,
      { auth: "required", revalidate: 0 }
    );
    return res.data?.content ?? [];
  } catch (error) {
    console.error(`getRouterMonitoringHistory Error for ID ${routerId}:`, error);
    return [];
  }
};

/** Polling alias for the live-telemetry connector (BE-AAA-045 pending). */
export const getRouterMonitoringHistory = getRouterHistory;

/**
 * Latest router health snapshot — polling alias for the missing SSE live
 * endpoint. Used by the NOC monitor page on a `refetchInterval` until the
 * backend lands `GET /network/monitoring/router/{id}/live` (BE-AAA-045).
 */
export async function getRouterMonitoringLatest(
  routerId: number
): Promise<RouterHealthSnapshot | null> {
  try {
    const res = await apiFetch<RouterHealthSnapshot>(
      `/network/monitoring/router/${routerId}/latest`,
      { auth: "required", revalidate: 0 }
    );
    return res.data ?? null;
  } catch (error) {
    console.error(`getRouterMonitoringLatest Error for ID ${routerId}:`, error);
    return null;
  }
};

export const getNetworkDeviceInterfaces = async (
  deviceId: number
): Promise<Record<string, unknown>[]> => {
  try {
    const res = await apiFetch<Record<string, unknown>[]>(
      `/network-devices/${deviceId}/interfaces`,
      { auth: "required", revalidate: 0 }
    );
    return Array.isArray(res.data) ? res.data : [];
  } catch (error) {
    console.error(`getNetworkDeviceInterfaces Error for device ID ${deviceId}:`, error);
    return [];
  }
};

export const getStationLoad = async (
  stationId: number
): Promise<RouterCapacityResponse[]> => {
  try {
    const res = await apiFetch<RouterCapacityResponse[]>(
      `/network/provisioning/station/${stationId}/load`,
      { auth: "required", revalidate: 0 }
    );
    if (!res.success) {
      throw new Error(`Failed to calculate station capacity load. Status: ${res.status}`);
    }
    return res.data ?? [];
  } catch (error) {
    console.error(`getStationLoad Error for station ID ${stationId}:`, error);
    return [];
  }
};

export const provisionSubscriber = async (
  request: SubscriberProvisioningRequest
): Promise<ApiResponse<void>> => {
  try {
    const res = await apiFetch<void>("/network/provisioning/pppoe", {
      method: "POST",
      body: request,
      auth: "required",
    });

    if (res.success) {
      revalidateTag("network:regions", "max");
    }
    return res;
  } catch (error: unknown) {
    return {
      status: 500,
      success: false,
      message: error instanceof Error ? error.message : "Failed to submit customer parameters to active terminal",
      data: null as unknown as void,
      timestamp: new Date().toISOString(),
    };
  }
};

export const getRouters = async (): Promise<RouterResponse[]> => {
  try {
    const params = await getRlsScopeParams();
    const res = await apiFetch<RouterResponse[]>(`/network/routers?${params.toString()}`, {
      auth: "required",
      tags: ["network:routers"],
    });

    if (!res.success) {
      console.error(`getRouters failed — status: ${res.status}, message: ${res.message}`);
      return [];
    }
    return res.data ?? [];
  } catch (error) {
    console.error("getRouters Error:", error);
    return [];
  }
};

/**
 * GET /api/v1/network/ip-pools — admin inventory view of IP pools.
 * NOTE: pool fields are currently hardcoded fixtures in the backend (BE-AAA-046).
 */
export async function getIpPools(): Promise<IpPool[]> {
  try {
    const res = await apiFetch<IpPool[]>("/network/ip-pools", {
      auth: "required",
      tags: ["network"],
    });
    return res.data ?? [];
  } catch (error) {
    console.error("[Network Action] getIpPools error:", error);
    return [];
  }
}

/**
 * GET /api/v1/network/ip-mappings — active/expired session bindings from RADIUS accounting logs.
 * Returns `ApiResponse<Page<IpMappingResponse>>`. Unwrap the Page envelope to `content[]`.
 */
export async function getIpMappings(): Promise<IpMappingResponse[]> {
  try {
    const res = await apiFetch<PageResponse<IpMappingResponse>>("/network/ip-mappings", {
      auth: "required",
      tags: ["network"],
    });
    return res.data?.content ?? [];
  } catch (error) {
    console.error("[Network Action] getIpMappings error:", error);
    return [];
  }
}

/**
 * Provision a static device (e.g. Smart TV) binding.
 * Backend: CustomerDeviceController POST /api/v1/customer-devices — writes the
 * reservation into `customer_devices` + FreeRADIUS radreply.
 */
export async function createIpMappingAction(input: {
  customerId: string | number;
  macAddress: string;
  ipAddress: string;
}): Promise<{ success: boolean; message: string }> {
  const session = await auth();
  if (!session?.user?.apiToken) {
    return { success: false, message: "You must be signed in to create a mapping." };
  }
  const perms = await getPermissionForRoute("/network/equipment");
  if (!perms.canCreate && !perms.canEdit) {
    return {
      success: false,
      message: "You don't have permission to create device mappings.",
    };
  }
  try {
    const res = await apiFetch("/customer-devices", {
      method: "POST",
      auth: "required",
      body: {
        customerIdxno: Number(input.customerId),
        macAddress: input.macAddress.trim(),
        ipAddress: input.ipAddress.trim(),
        deviceType: "SMART_TV",
      },
    });

    if (!res.success) {
      return {
        success: false,
        message: res.message || `Failed to create mapping (HTTP ${res.status})`,
      };
    }
    revalidateTag("network", "max");
    return { success: true, message: "Mapping created successfully." };
  } catch (error) {
    console.error("[Network Action] createIpMappingAction error:", error);
    return { success: false, message: "Failed to create mapping." };
  }
}