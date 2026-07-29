"use server";

import { BASE_URL } from "@/lib/constants";
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
import { revalidatePath, revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";

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
    revalidateTag("pending-routers", "page");

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

    revalidateTag(`router-${id}`, "page");
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
        revalidateTag("network:regions", "page");
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
      revalidateTag("network:regions", "page");
      return {
        success: true,
        message: "Region created successfully",
        data: null,
        status: response.status,
      };
    }

    revalidateTag("network:regions", "page");
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
    revalidateTag("network:regions", "page");
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
    let parseOk = false;
    try {
      parsed = JSON.parse(textBody);
      parseOk = true;
    } catch {
      if (response.ok) {
        revalidateTag(`network:locations:region:${request.regionIdxno}`, "page");
        revalidateTag("network:regions", "page");
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

    revalidateTag(`network:locations:region:${request.regionIdxno}`, "page");
    revalidateTag("network:regions", "page");
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
    revalidateTag(`network:locations:region:${regionIdxno}`, "page");
    revalidateTag("network:regions", "page");
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
    let parseOk = false;
    try {
      parsed = JSON.parse(textBody);
      parseOk = true;
    } catch {
      if (response.ok) {
        revalidateTag(`network:stations:location:${request.locationIdxno}`, "page");
        revalidateTag("network:regions", "page");
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

    revalidateTag(`network:stations:location:${request.locationIdxno}`, "page");
    revalidateTag("network:regions", "page");
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
    revalidateTag(`network:stations:location:${locationIdxno}`, "page");
    revalidateTag("network:regions", "page");
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
    const headers = await getAuthHeaders();
    const res = await fetch(`${BASE_URL}network/routers/validate-connectivity`, {
      method: "POST",
      headers,
      body: JSON.stringify(request),
    });

    return await res.json();
  } catch (error: any) {
    return {
      status: 500,
      success: false,
      message: error.message || "Failed to establish hardware API connection on port 8728",
      data: null as any,
      timestamp: new Date().toISOString(),
    };
  }
};

export const onboardRouter = async (
  request: RouterOnboardRequest
): Promise<ApiResponse<any>> => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${BASE_URL}network/routers/onboard`, {
      method: "POST",
      headers,
      body: JSON.stringify(request),
    });

    const body = await res.json();
    if (body.success) {
      revalidateTag("network:regions", "page");
    }
    return body;
  } catch (error: any) {
    return {
      status: 500,
      success: false,
      message: error.message || "Failed to finalize database onboarding registration",
      data: null as any,
      timestamp: new Date().toISOString(),
    };
  }
};

export const getRouterHistory = async (
  routerId: number,
  limit: number = 30
): Promise<RouterHealthSnapshot[]> => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${BASE_URL}network/monitoring/router/${routerId}/history?limit=${limit}`, {
      method: "GET",
      headers,
      next: { revalidate: 0 },
    });

    if (!res.ok) throw new Error(`History fetch failed. Status: ${res.status}`);
    const body: ApiResponse<RouterHealthSnapshot[]> = await res.json();
    return body.data || [];
  } catch (error) {
    console.error(`getRouterHistory Error for ID ${routerId}:`, error);
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
      revalidateTag("network:regions", "page");
    }
    return body;
  } catch (error: any) {
    return {
      status: 500,
      success: false,
      message: error.message || "Failed to submit customer parameters to active terminal",
      data: null as any,
      timestamp: new Date().toISOString(),
    };
  }
};

export const getRouters = async (): Promise<RouterResponse[]> => {
  try {
    const params = await getRlsScopeParams();
    const res = await fetch(`${BASE_URL}network/routers?${params.toString()}`, {
      method: "GET",
      headers: await getAuthHeaders(),
      next: { tags: ["network:routers"] },
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`getRouters failed — status: ${res.status}, response: ${errorText}`);
      throw new Error(`Failed to fetch routers: ${res.status}`);
    }
    const body = await res.json();
    return body.data || [];
  } catch (error) {
    console.error("getRouters Error:", error);
    return [];
  }
};

export async function getIpPools() {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${BASE_URL}network/ip-pools`, {
      headers,
      next: { tags: ["network"] },
    });
    if (!res.ok) throw new Error(`Failed to fetch IP pools: ${res.statusText}`);
    const body = await res.json();
    return body.data || [];
  } catch (error) {
    console.error("[Network Action] getIpPools error:", error);
    return [];
  }
}

export async function getIpMappings() {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${BASE_URL}network/ip-mappings`, {
      headers,
      next: { tags: ["network"] },
    });
    if (!res.ok) throw new Error(`Failed to fetch IP mappings: ${res.statusText}`);
    const body = await res.json();
    return body.data || [];
  } catch (error) {
    console.error("[Network Action] getIpMappings error:", error);
    return [];
  }
}
