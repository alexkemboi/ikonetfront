"use server";

import { revalidatePath } from "next/cache";
import {
  Customer,
  CustomerApiResponse,
  AddCustomerPayload,
  UpdateCustomerPayload,
  CustomerFilters,
} from "@/lib/types/customer";

const BASE_URL = "https://beesmartbedak.com/api/v1";

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
) {
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

    const response = await fetch(`${BASE_URL}/customers?${params.toString()}`, {
      next: {
        tags: ["customers"],
      },
    });

    if (!response.ok) {
      return handleApiResponse(response, "Failed to fetch customers");
    }

    const data = await response.json();
    return data;
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
){
  try {
    const response = await fetch(`${BASE_URL}/customers/${id}`, {
      next: {
        tags: [`customer-${id}`],
      },
    });

    if (!response.ok) {
      return handleApiResponse(response, "Failed to fetch customer by ID");
    }

    const data = await response.json();
    return data;
  } catch (error: unknown) {
    console.error(`Error fetching customer ${id}:`, error);
    return {
      status: 500,
      success: false,
      message: (error instanceof Error ? error.message : String(error)) || "An unexpected error occurred",
      data: {}, // Return an empty Customer object or null if appropriate
      timestamp: new Date().toISOString(),
    };
  }
}

export async function addCustomer(
  payload: AddCustomerPayload
){
  try {
    const response = await fetch(`${BASE_URL}/customers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return handleApiResponse(response, "Failed to add customer");
    }

    const data= await response.json();
    revalidatePath("/customers/all");
    return data;
  } catch (error: unknown) {
    console.error("Error adding customer:", error);
    return {
      status: 500,
      success: false,
      message: (error instanceof Error ? error.message : String(error)) || "An unexpected error occurred",
      data: {} as Customer,
      timestamp: new Date().toISOString(),
    };
  }
}

export async function updateCustomer(
  id: number,
  payload: UpdateCustomerPayload
){
  try {
    const response = await fetch(`${BASE_URL}/customers/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return handleApiResponse(response, "Failed to update customer");
    }

    const data= await response.json();
    revalidatePath("/customers/all");
    revalidatePath("/customers/active");
    revalidatePath("/customers/pppoe");
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
    const response = await fetch(`${BASE_URL}/customers/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      return handleApiResponse(response, "Failed to delete customer");
    }

    const data = await response.json();
    revalidatePath("/customers/all");
    revalidatePath("/customers/active");
    revalidatePath("/customers/pppoe");
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
    const response = await fetch(`${BASE_URL}/customers/${id}/toggle-active`, {
      method: "PATCH",
    });

    if (!response.ok) {
      return handleApiResponse(
        response,
        "Failed to toggle customer active status"
      );
    }

    const data = await response.json();
    revalidatePath("/customers/all");
    revalidatePath("/customers/active");
    revalidatePath("/customers/pppoe");
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
      `${BASE_URL}/customers/${id}/renew?duration=${duration}&unit=${unit}`,
      {
        method: "PATCH",
      }
    );

    if (!response.ok) {
      return handleApiResponse(response, "Failed to renew customer subscription");
    }

    const data = await response.json();
    revalidatePath("/customers/all");
    revalidatePath("/customers/active");
    revalidatePath("/customers/pppoe");
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
      `${BASE_URL}/customers/${id}/change-password?newPassword=${newPassword}`,
      {
        method: "PATCH",
      }
    );

    if (!response.ok) {
      return handleApiResponse(response, "Failed to change customer password");
    }

    const data: CustomerApiResponse<null> = await response.json();
    revalidatePath("/customers/all");
    revalidatePath("/customers/pppoe");
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
