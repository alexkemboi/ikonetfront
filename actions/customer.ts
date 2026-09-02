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
  const res = await apiFetch<Customer>(`/customers/${id}`, {
    method: "PUT",
    body: payload,
    auth: "required",
  });
  if (res.success) {
    revalidatePath("/customers/all");
    revalidatePath(`/customers/${id}`);
  }
  return res;
}

export async function deleteCustomer(
  id: number
){
  const res = await apiFetch<null>(`/customers/${id}`, {
    method: "DELETE",
    auth: "required",
  });
  if (res.success) {
    revalidatePath("/customers/all");
  }
  return res;
}

export async function toggleCustomerActiveStatus(
  id: number
){
  const res = await apiFetch<Customer>(`/customers/${id}/toggle-active`, {
    method: "PATCH",
    auth: "required",
  });
  if (res.success) {
    revalidatePath("/customers/all");
    revalidatePath(`/customers/${id}`);
  }
  return res;
}

export async function renewCustomerSubscription(
  id: number,
  duration: number,
  unit: string
){
  const res = await apiFetch<Customer>(
    `/customers/${id}/renew?duration=${duration}&unit=${unit}`,
    {
      method: "PATCH",
      auth: "required",
    }
  );
  if (res.success) {
    revalidatePath("/customers/all");
    revalidatePath(`/customers/${id}`);
  }
  return res;
}

export async function changeCustomerPassword(
  id: number,
  newPassword: string
) {
  const res = await apiFetch<string>(
    `/customers/${id}/change-password?newPassword=${encodeURIComponent(newPassword)}`,
    {
      method: "PATCH",
      auth: "required",
    }
  );
  if (res.success) {
    revalidatePath("/customers/all");
    revalidatePath(`/customers/${id}`);
  }
  return res;
}
