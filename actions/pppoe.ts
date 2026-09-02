"use server";

import { revalidateTag } from "next/cache";
import { apiFetch } from "@/lib/apiClient";
import type {
  PppoePackageResponse,
  PppoePackageRequest,
  PppoeAccountResponse,
  PppoeAccountRequest,
  PppoeSubscriptionResponse,
  AssignPackageRequest,
  PppoePaymentRequest,
  PppoePackagesResponse,
  PppoeAccountResponseEnvelope,
  PppoeAccountsResponse,
  PppoeSubscriptionsResponse,
} from "@/lib/types/pppoe";
import type { ApiResponse } from "@/lib/types/api";

/**
 * PPPoE domain actions — all 13 live endpoints (api-docs.json, bearer except
 * `POST /pppoe/radius/auth` which the RADIUS NAS calls directly and stays out
 * of the actions surface).
 *
 * Tag conventions: `pppoe:packages`, `pppoe:accounts:customer-${id}`,
 * `pppoe:subscriptions:customer-${id}` — mutations revalidate the matching tag
 * so the customer / portal pages refetch.
 */

export async function getPppoePackagesAction(): Promise<PppoePackagesResponse> {
  const res = await apiFetch<PppoePackageResponse[]>("/pppoe/packages", {
    auth: "required",
    tags: ["pppoe:packages"],
    revalidate: 60,
  });
  return res.success && Array.isArray(res.data)
    ? res
    : { ...res, success: false, data: [] };
}

export async function createPppoePackageAction(
  request: PppoePackageRequest
): Promise<ApiResponse<PppoePackageResponse>> {
  const res = await apiFetch<PppoePackageResponse>("/pppoe/packages", {
    method: "POST",
    body: request,
    auth: "required",
  });
  if (res.success) revalidateTag("pppoe:packages", "max");
  return res;
}

export async function getPppoeAccountsByCustomerAction(
  customerId: string
): Promise<PppoeAccountsResponse> {
  const res = await apiFetch<PppoeAccountResponse[]>(
    `/pppoe/accounts/customer/${customerId}`,
    { auth: "required", tags: [`pppoe:accounts:customer-${customerId}`], revalidate: 30 }
  );
  return res.success && Array.isArray(res.data)
    ? res
    : { ...res, success: false, data: [] };
}

export async function createPppoeAccountAction(
  request: PppoeAccountRequest
): Promise<PppoeAccountResponseEnvelope> {
  const res = await apiFetch<PppoeAccountResponse>("/pppoe/accounts", {
    method: "POST",
    body: request,
    auth: "required",
  });
  if (res.success && request.customerId) {
    revalidateTag(`pppoe:accounts:customer-${request.customerId}`, "max");
  }
  return res;
}

export async function suspendPppoeAccountAction(
  id: string
): Promise<ApiResponse<null>> {
  const res = await apiFetch<null>(`/pppoe/accounts/${id}/suspend`, {
    method: "PATCH",
    auth: "required",
  });
  return res;
}

export async function activatePppoeAccountAction(
  id: string
): Promise<ApiResponse<null>> {
  const res = await apiFetch<null>(`/pppoe/accounts/${id}/activate`, {
    method: "PATCH",
    auth: "required",
  });
  return res;
}

export async function getPppoeSubscriptionsByCustomerAction(
  customerId: string
): Promise<PppoeSubscriptionsResponse> {
  const res = await apiFetch<PppoeSubscriptionResponse[]>(
    `/pppoe/subscriptions/customer/${customerId}`,
    { auth: "required", tags: [`pppoe:subscriptions:customer-${customerId}`], revalidate: 30 }
  );
  return res.success && Array.isArray(res.data)
    ? res
    : { ...res, success: false, data: [] };
}

export async function assignPppoePackageAction(
  request: AssignPackageRequest
): Promise<ApiResponse<null>> {
  const res = await apiFetch<null>("/pppoe/subscriptions/activate", {
    method: "POST",
    body: request,
    auth: "required",
  });
  if (res.success && request.customerId) {
    revalidateTag(`pppoe:subscriptions:customer-${request.customerId}`, "max");
  }
  return res;
}

export async function renewPppoeSubscriptionAction(
  customerId: string,
  accountId: string
): Promise<ApiResponse<null>> {
  const res = await apiFetch<null>(
    `/pppoe/subscriptions/renew?customerId=${encodeURIComponent(customerId)}&accountId=${encodeURIComponent(accountId)}`,
    { method: "POST", auth: "required" }
  );
  if (res.success) {
    revalidateTag(`pppoe:subscriptions:customer-${customerId}`, "max");
  }
  return res;
}

export async function stkPushPppoePaymentAction(
  request: PppoePaymentRequest
): Promise<ApiResponse<null>> {
  return apiFetch<null>("/pppoe/payments/stk-push", {
    method: "POST",
    body: request,
    auth: "required",
  });
}