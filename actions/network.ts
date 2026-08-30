"use server";

import { BASE_URL, buildApiUrl } from "@/lib/constants";
import { safeJsonParse } from "@/lib/utils/api";
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


async function getAuthHeaders(): Promise<HeadersInit> {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  
  const session = await auth();
  if (session?.user?.apiToken) {
    headers["Authorization"] = `Bearer ${session.user.apiToken}`;
  }
  
  return headers;
}
  

export const getPendingRouters = async (): Promise<ApiResponse<NetworkRouter[]>> => {
  try {
    const params = await getRlsScopeParams();
    const response = await fetch(BASE_URL + "network-routers/pending?" + params.toString(), {
      headers: await getAuthHeaders(),
      next: { tags: ["pending-routers"] },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Failed to fetch pending routers",
        data: [],
        status: response.status,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      message: data.message || "Pending routers fetched successfully",
      data: data.data as NetworkRouter[],
      status: response.status,
      timestamp: data.timestamp,
    };
  } catch (error: unknown) {
    console.error("Error fetching pending routers:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch pending routers",
      data: [],
      status: 500,
      timestamp: new Date().toISOString(),
    };
  }
};

export const getTopologyTree = async (): Promise<ApiResponse<TopologyNode[]>> => {
  try {
    const response = await fetch(BASE_URL + "network-routers/topology", {
      headers: await getAuthHeaders(),
      next: { tags: ["router-topology"] },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Failed to fetch topology",
        data: [],
        status: response.status,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      message: data.message || "Topology loaded successfully",
      data: data.data as TopologyNode[],
      status: response.status,
      timestamp: data.timestamp,
    };
  } catch (error: unknown) {
    console.error("Error fetching topology:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch topology",
      data: [],
      status: 500,
      timestamp: new Date().toISOString(),
    };
  }
};

export const getRouterDetails = async (id: number): Promise<ApiResponse<NetworkRouter | null>> => {
  try {
    const response = await fetch(BASE_URL + `network-routers/${id}`, {
      headers: await getAuthHeaders(),
      next: { tags: [`router-${id}`] },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Failed to fetch router details",
        data: null,
        status: response.status,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      message: data.message || "Router details fetched successfully",
      data: data.data as NetworkRouter,
      status: response.status,
      timestamp: data.timestamp,
    };
  } catch (error: unknown) {
    console.error("Error fetching router details:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch router details",
      data: null,
      status: 500,
      timestamp: new Date().toISOString(),
    };
  }
};

export const finalizeRouter = async (
  id: number,
  body: RouterConfigRequest
): Promise<ApiResponse<NetworkRouter | null>> => {
  try {
    const response = await fetch(BASE_URL + `network-routers/${id}/finalize`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Failed to finalize router",
        data: null,
        status: response.status,
        timestamp: new Date().toISOString(),
      };
    }

    revalidatePath("/network/routers");
    updateTag("pending-routers");

    return {
      success: true,
      message: data.message || "Router finalized successfully",
      data: data.data as NetworkRouter,
      status: response.status,
      timestamp: data.timestamp,
    };
  } catch (error: unknown) {
    console.error("Error finalizing router:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to finalize router",
      data: null,
      status: 500,
      timestamp: new Date().toISOString(),
    };
  }
};

export const updateRouter = async (
  id: number,
  body: RouterConfigRequest
): Promise<ApiResponse<NetworkRouter | null>> => {
  try {
    const response = await fetch(BASE_URL + `network-routers/${id}`, {
      method: "PATCH",
      headers: await getAuthHeaders(),
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Failed to update router",
        data: null,
        status: response.status,
        timestamp: new Date().toISOString(),
      };
    }

    updateTag(`router-${id}`);
    revalidatePath("/network/routers");

    return {
      success: true,
      message: data.message || "Router updated successfully",
      data: data.data as NetworkRouter,
      status: response.status,
      timestamp: data.timestamp,
    };
  } catch (error: unknown) {
    console.error("Error updating router:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update router",
      data: null,
      status: 500,
      timestamp: new Date().toISOString(),
    };
  }
};

export const executeRouterAction = async (
  id: number,
  body: RouterActionRequest
): Promise<ApiResponse<RouterActionResponse | null>> => {
  try {
    const response = await fetch(BASE_URL + `network-routers/${id}/action`, {
      method: "PATCH",
      headers: await getAuthHeaders(),
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Failed to execute router action",
        data: null,
        status: response.status,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      message: data.message || "Action executed successfully",
      data: data.data as RouterActionResponse,
      status: response.status,
      timestamp: data.timestamp,
    };
  } catch (error: unknown) {
    console.error("Error executing router action:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to execute action",
      data: null,
      status: 500,
      timestamp: new Date().toISOString(),
    };
  }
};

// ── Region actions ────────────────────────────────────────────────────────

/** Extract an array from a response that may be `{data: [...]}` or `[...]` directly */
function resolveDataArray<T>(parsed: unknown): T[] {
  if (Array.isArray(parsed)) return parsed as T[];
  if (parsed && typeof parsed === "object" && "data" in (parsed as Record<string, unknown>)) {
    const arr = (parsed as Record<string, unknown>).data;
    if (Array.isArray(arr)) return arr as T[];
  }
  return [];
}

export const getRegions = async (tree?: boolean): Promise<RegionResponse[]> => {
  try {
    const params = await getRlsScopeParams();
    if (tree) params.append("tree", "true");
    const url = BASE_URL + "network/regions?" + params.toString();
    console.log("[getRegions] fetching:", url);
    const response = await fetch(url, {
      cache: "no-store",
      headers: await getAuthHeaders(),
    });
    console.log("[getRegions] status:", response.status);
    const { parsed, ok, error } = await safeJsonParse<unknown>(response, {});
    if (!response.ok || !ok) {
      console.error("[getRegions] failed — status:", response.status, "ok:", ok, "error:", error, "parsed:", parsed);
      return [];
    }
    const result = resolveDataArray<RegionResponse>(parsed);
    console.log("[getRegions] resolved count:", result.length);
    return result;
  } catch (error) {
    console.error("[getRegions] error:", error);
    return [];
  }
};

export const createRegion = async (
  request: RegionRequest
): Promise<AuthApiResponse<RegionResponse>> => {
  try {
    const response = await fetch(BASE_URL + "network/regions", {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify(request),
    });

    // Handle empty or non-JSON response bodies gracefully
    const textBody = await response.text();
    let parsed: Record<string, unknown> = {};
    let parseOk = false;
    try {
      parsed = JSON.parse(textBody);
      parseOk = true;
    } catch {
      // Response body is empty or not JSON — treat 2xx as success
      if (response.ok) {
        revalidateTag("network:regions", "max");
        return {
          success: true,
          message: "Region created successfully",
          data: null,
          status: response.status,
        };
      }
    }

    if (!response.ok) {
      return {
        success: false,
        message: (parsed?.message as string) || `HTTP ${response.status}`,
        data: null,
        status: response.status,
      };
    }

    if (!parseOk) {
      revalidateTag("network:regions", "max");
      return {
        success: true,
        message: "Region created successfully",
        data: null,
        status: response.status,
      };
    }

    revalidateTag("network:regions", "max");
    return {
      success: true,
      message: (parsed.message as string) || "Region created successfully",
      data: parsed.data as RegionResponse,
      status: response.status,
    };
  } catch (error: unknown) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to create region",
      data: null,
      status: 500,
    };
  }
};

export const deleteRegion = async (
  id: number
): Promise<AuthApiResponse<void>> => {
  try {
    const response = await fetch(BASE_URL + `network/regions/${id}`, {
      method: "DELETE",
      headers: await getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Failed to delete region",
        data: null,
        status: response.status,
      };
    }
    revalidateTag("network:regions", "max");
    return {
      success: true,
      message: data.message || "Region deleted successfully",
      data: undefined,
      status: response.status,
    };
  } catch (error: unknown) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to delete region",
      data: null,
      status: 500,
    };
  }
};

// ── Location actions ──────────────────────────────────────────────────────

export const getLocationsByRegion = async (regionIdxno: number): Promise<LocationResponse[]> => {
  try {
    const params = await getRlsScopeParams();
    const url = BASE_URL + `network/locations/region/${regionIdxno}?${params.toString()}`;
    console.log("[getLocationsByRegion] fetching:", url);
    const response = await fetch(url, {
      cache: "no-store",
      headers: await getAuthHeaders(),
    });
    console.log("[getLocationsByRegion] status:", response.status);
    const { parsed, ok, error } = await safeJsonParse<unknown>(response, {});
    if (!response.ok || !ok) {
      console.error("[getLocationsByRegion] failed — status:", response.status, "error:", error, "parsed:", parsed);
      return [];
    }
    const result = resolveDataArray<LocationResponse>(parsed);
    console.log("[getLocationsByRegion] resolved count:", result.length);
    return result;
  } catch (error) {
    console.error("[getLocationsByRegion] error:", error);
    return [];
  }
};

export const createLocation = async (
  request: LocationRequest
): Promise<AuthApiResponse<LocationResponse>> => {
  try {
    const response = await fetch(BASE_URL + "network/locations", {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify(request),
    });

    const textBody = await response.text();
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(textBody);
    } catch {
      if (response.ok) {
        updateTag(`network:locations:region:${request.regionIdxno}`);
        updateTag("network:regions");
        return {
          success: true,
          message: "Location created successfully",
          data: null,
          status: response.status,
        };
      }
    }

    if (!response.ok) {
      return {
        success: false,
        message: (parsed?.message as string) || `HTTP ${response.status}`,
        data: null,
        status: response.status,
      };
    }

    updateTag(`network:locations:region:${request.regionIdxno}`);
    updateTag("network:regions");
    return {
      success: true,
      message: (parsed.message as string) || "Location created successfully",
      data: parsed.data as LocationResponse,
      status: response.status,
    };
  } catch (error: unknown) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to create location",
      data: null,
      status: 500,
    };
  }
};

export const deleteLocation = async (
  id: number,
  regionIdxno: number
): Promise<AuthApiResponse<void>> => {
  try {
    const response = await fetch(BASE_URL + `network/locations/${id}`, {
      method: "DELETE",
      headers: await getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Failed to delete location",
        data: null,
        status: response.status,
      };
    }
    updateTag(`network:locations:region:${regionIdxno}`);
    updateTag("network:regions");
    return {
      success: true,
      message: data.message || "Location deleted successfully",
      data: undefined,
      status: response.status,
    };
  } catch (error: unknown) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to delete location",
      data: null,
      status: 500,
    };
  }
};

// ── Station actions ───────────────────────────────────────────────────────

export const getStationsByLocation = async (locationIdxno: number): Promise<StationResponse[]> => {
  try {
    const params = await getRlsScopeParams();
    const url = BASE_URL + `network/stations/location/${locationIdxno}?${params.toString()}`;
    console.log("[getStationsByLocation] fetching:", url);
    const response = await fetch(url, {
      cache: "no-store",
      headers: await getAuthHeaders(),
    });
    console.log("[getStationsByLocation] status:", response.status);
    const { parsed, ok, error } = await safeJsonParse<unknown>(response, {});
    if (!response.ok || !ok) {
      console.error("[getStationsByLocation] failed — status:", response.status, "error:", error, "parsed:", parsed);
      return [];
    }
    const result = resolveDataArray<StationResponse>(parsed);
    console.log("[getStationsByLocation] resolved count:", result.length);
    return result;
  } catch (error) {
    console.error("[getStationsByLocation] error:", error);
    return [];
  }
};

export const createStation = async (
  request: StationRequest
): Promise<AuthApiResponse<StationResponse>> => {
  try {
    const response = await fetch(BASE_URL + "network/stations", {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify(request),
    });

    const textBody = await response.text();
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(textBody);
    } catch {
      if (response.ok) {
        updateTag(`network:stations:location:${request.locationIdxno}`);
        updateTag("network:regions");
        return {
          success: true,
          message: "Station created successfully",
          data: null,
          status: response.status,
        };
      }
    }

    if (!response.ok) {
      return {
        success: false,
        message: (parsed?.message as string) || `HTTP ${response.status}`,
        data: null,
        status: response.status,
      };
    }

    updateTag(`network:stations:location:${request.locationIdxno}`);
    updateTag("network:regions");
    return {
      success: true,
      message: (parsed.message as string) || "Station created successfully",
      data: parsed.data as StationResponse,
      status: response.status,
    };
  } catch (error: unknown) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to create station",
      data: null,
      status: 500,
    };
  }
};

export const deleteStation = async (
  id: number,
  locationIdxno: number
): Promise<AuthApiResponse<void>> => {
  try {
    const response = await fetch(BASE_URL + `network/stations/${id}`, {
      method: "DELETE",
      headers: await getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Failed to delete station",
        data: null,
        status: response.status,
      };
    }
    updateTag(`network:stations:location:${locationIdxno}`);
    updateTag("network:regions");
    return {
      success: true,
      message: data.message || "Station deleted successfully",
      data: undefined,
      status: response.status,
    };
  } catch (error: unknown) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to delete station",
      data: null,
      status: 500,
    };
  }
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
    const res = await fetch(buildApiUrl(`/network-devices/${deviceId}/interfaces`), {
      headers: await getAuthHeaders(),
      next: { revalidate: 0 },
    });

    if (!res.ok) return [];
    const body: ApiResponse<Record<string, unknown>[] | null> = await res.json();
    return Array.isArray(body.data) ? body.data : [];
  } catch (error) {
    console.error(`getNetworkDeviceInterfaces Error for device ID ${deviceId}:`, error);
    return [];
  }
};



export const getStationLoad = async (
  stationId: number
): Promise<RouterCapacityResponse[]> => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${BASE_URL}network/provisioning/station/${stationId}/load`, {
      method: "GET",
      headers,
      next: { revalidate: 0 },
    });

    if (!res.ok) throw new Error(`Failed to calculate station capacity load. Status: ${res.status}`);
    const body: ApiResponse<RouterCapacityResponse[]> = await res.json();
    return body.data || [];
  } catch (error) {
    console.error(`getStationLoad Error for station ID ${stationId}:`, error);
    return [];
  }
};

export const provisionSubscriber = async (
  request: SubscriberProvisioningRequest
): Promise<ApiResponse<void>> => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${BASE_URL}network/provisioning/pppoe`, {
      method: "POST",
      headers,
      body: JSON.stringify(request),
    });

    const body = await res.json();
    if (body.success) {
      revalidateTag("network:regions", "max");
    }
    return body;
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
