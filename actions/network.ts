"use server";

import { auth } from "@/lib/auth";
import { BASE_URL } from "@/lib/constants";
import {
  ApiResponse,
  NetworkRouter,
  RouterActionRequest,
  RouterActionResponse,
  RouterConfigRequest,
  TopologyNode,
} from "@/lib/types/network-router";
import { revalidatePath, revalidateTag } from "next/cache";


async function getAuthHeaders(): Promise<HeadersInit> {
  const session = await auth();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (session?.user?.apiToken) {
    (headers as Record<string, string>)["Authorization"] =
      `Bearer ${session.user.apiToken}`;
  }
  return headers;
}
  

export const getPendingRouters = async (): Promise<ApiResponse<NetworkRouter[]>> => {
  try {
    const response = await fetch(BASE_URL + "network-routers/pending", {
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
