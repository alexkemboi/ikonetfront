"use server";

import { revalidatePath } from "next/cache";
import {
  Customer,
  CustomerApiResponse,
  AddCustomerPayload,
  UpdateCustomerPayload,
  CustomerFilters,
} from "@/lib/types/customer";
import type { ApiResponse, PageResponse } from "@/lib/types/api";
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
  return headers;
}

function emptyCustomerPage(page = 0, size = 0): PageResponse<never> {
  return {
    content: [],
    pageable: {
      pageNumber: page,
      pageSize: size,
      sort: { unsorted: true, sorted: false, empty: true },
      offset: 0,
      unpaged: false,
      paged: false,
    },
    totalElements: 0,
    totalPages: 0,
    last: true,
    first: true,
    numberOfElements: 0,
    size,
    number: page,
    sort: { unsorted: true, sorted: false, empty: true },
    empty: true,
  };
}



const handleApiResponse = async(
  response: Response,
  defaultErrorMessage: string
)=> {
  const contentType = response.headers.get("content-type");
  let errorData: unknown;

  if (contentType && contentType.includes("application/json")) {
    errorData = await response.json();
  } else {
    errorData = await response.text();
  }

  return {
    status: response.status,
    success: false,
    message:
      typeof errorData === "string"
        ? errorData
        : (errorData as { message?: string }).message  || defaultErrorMessage,
    data: {
      content: [],
      pageable: {
        pageNumber: 0,
        pageSize: 0,
        sort: { unsorted: true, sorted: false, empty: true },
        offset: 0,
        unpaged: false,
        paged: false,
      },
      totalElements: 0,
      totalPages: 0,
      last: true,
      first: true,
      numberOfElements: 0,
      size: 0,
      number: 0,
      sort: { unsorted: true, sorted: false, empty: true },
      empty: true,
    },
    timestamp: new Date().toISOString(),
    error: (errorData as { message?: string })?.message || String(errorData) || "An unknown error occurred",
  };
};

export async function getCustomers(
  page: number = 0,
  size: number = 10,
  filters?: CustomerFilters
): Promise<CustomerApiResponse<Customer>> {
  try {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("size", size.toString());

    if (filters?.isActive !== undefined) {
      params.append("isActive", filters.isActive.toString());
    }
    if (filters?.custtype) {
      params.append("custtype", filters.custtype);
    }
    if (filters?.search) {
      params.append("search", filters.search);
    }

    const scopeParams = await getRlsScopeParams();
    scopeParams.forEach((value, key) => params.append(key, value));

    const res = await apiFetch<PageResponse<Customer>>(`/customers?${params.toString()}`, {
      auth: "required",
      tags: ["customers"],
    });
    return res as CustomerApiResponse<Customer>;
  } catch (error: unknown) {
    console.error("Error fetching customers:", error);
    return {
      status: 500,
      success: false,
      message: (error instanceof Error ? error.message : String(error)) || "An unexpected error occurred",
      data: {
        content: [],
        pageable: {
          pageNumber: page,
          pageSize: size,
          sort: { unsorted: true, sorted: false, empty: true },
          offset: 0,
          unpaged: false,
          paged: false,
        },
        totalElements: 0,
        totalPages: 0,
        last: true,
        first: true,
        numberOfElements: 0,
        size: size,
        number: page,
        sort: { unsorted: true, sorted: false, empty: true },
        empty: true,
      },
      timestamp: new Date().toISOString(),
    };
  }
}

export async function getCustomerById(
  id: number
): Promise<ApiResponse<Customer>> {
  try {
    const res = await apiFetch<Customer>(`/customers/${id}`, {
      auth: "required",
      tags: [`customer-${id}`],
    });
    return res;
  } catch (error: unknown) {
    console.error(`Error fetching customer ${id}:`, error);
    return {
      status: 500,
      success: false,
      message: (error instanceof Error ? error.message : String(error)) || "An unexpected error occurred",
      data: {} as Customer,
      timestamp: new Date().toISOString(),
    };
  }
}

export async function addCustomer(
  payload: AddCustomerPayload
): Promise<CustomerApiResponse<Customer>> {
  try {
    const res = await apiFetch<PageResponse<Customer>>("/customers", {
      method: "POST",
      body: payload,
      auth: "required",
    });

    if (res.success) {
      revalidatePath("/customers/all");
    }

    return res as CustomerApiResponse<Customer>;
  } catch (error: unknown) {
    console.error("Error adding customer:", error);
    return {
      status: 500,
      success: false,
      message: (error instanceof Error ? error.message : String(error)) || "An unexpected error occurred",
      data: emptyCustomerPage(),
      timestamp: new Date().toISOString(),
    };
  }
}

export async function updateCustomer(
  id: number,
  payload: UpdateCustomerPayload
){
  try {
    const response = await fetch(`${BASE_URL}customers/${id}`, {
      method: "PUT",
      headers: await getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return handleApiResponse(response, "Failed to update customer");
    }

    const data= await response.json();
    revalidatePath("/customers/all");
    revalidatePath(`/customers/${id}`);
    return data;
  } catch (error: unknown) {
    console.error(`Error updating customer ${id}:`, error);
    return {
      status: 500,
      success: false,
      message: (error instanceof Error ? error.message : String(error)) || "An unexpected error occurred",
      data: {} as Customer,
      timestamp: new Date().toISOString(),
    };
  }
}

export async function deleteCustomer(
  id: number
){
  try {
    const response = await fetch(`${BASE_URL}customers/${id}`, {
      method: "DELETE",
      headers: await getAuthHeaders(),
    });

    if (!response.ok) {
      return handleApiResponse(response, "Failed to delete customer");
    }

    const data = await response.json();
    revalidatePath("/customers/all");
    return data;
  } catch (error: unknown) {
    console.error(`Error deleting customer ${id}:`, error);
    return {
      status: 500,
      success: false,
      message: (error instanceof Error ? error.message : String(error)) || "An unexpected error occurred",
      data: null, // data is null for delete
      timestamp: new Date().toISOString(),
    };
  }
}

export async function toggleCustomerActiveStatus(
  id: number
){
  try {
    const response = await fetch(`${BASE_URL}customers/${id}/toggle-active`, {
      method: "PATCH",
      headers: await getAuthHeaders(),
    });

    if (!response.ok) {
      return handleApiResponse(
        response,
        "Failed to toggle customer active status"
      );
    }

    const data = await response.json();
    revalidatePath("/customers/all");
    revalidatePath(`/customers/${id}`);
    return data;
  } catch (error: unknown) {
    console.error(`Error toggling active status for customer ${id}:`, error);
    return {
      status: 500,
      success: false,
      message: (error instanceof Error ? error.message : String(error)) || "An unexpected error occurred",
      data: null,
      timestamp: new Date().toISOString(),
    };
  }
}

export async function renewCustomerSubscription(
  id: number,
  duration: number,
  unit: string
){
  try {
    const response = await fetch(
      `${BASE_URL}customers/${id}/renew?duration=${duration}&unit=${unit}`,
      {
        method: "PATCH",
        headers: await getAuthHeaders(),
      }
    );

    if (!response.ok) {
      return handleApiResponse(response, "Failed to renew customer subscription");
    }

    const data = await response.json();
    revalidatePath("/customers/all");
    revalidatePath(`/customers/${id}`);
    return data;
  } catch (error: unknown) {
    console.error(`Error renewing subscription for customer ${id}:`, error);
    return {
      status: 500,
      success: false,
      message: (error instanceof Error ? error.message : String(error)) || "An unexpected error occurred",
      data: null,
      timestamp: new Date().toISOString(),
    };
  }
}

export async function changeCustomerPassword(
  id: number,
  newPassword: string
) {
  try {
    const response = await fetch(
      `${BASE_URL}customers/${id}/change-password?newPassword=${newPassword}`,
      {
        method: "PATCH",
        headers: await getAuthHeaders(),
      }
    );

    if (!response.ok) {
      return handleApiResponse(response, "Failed to change customer password");
    }

    const data: CustomerApiResponse<null> = await response.json();
    revalidatePath("/customers/all");
    revalidatePath(`/customers/${id}`);
    return data;
  } catch (error: unknown) {
    console.error(`Error changing password for customer ${id}:`, error);
    return {
      status: 500,
      success: false,
      message: (error instanceof Error ? error.message : String(error)) || "An unexpected error occurred",
      data: null,
      timestamp: new Date().toISOString(),
    };
  }
}
