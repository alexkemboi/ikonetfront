"use server";

import { apiFetch } from "@/lib/apiClient";
import type { ApiResponse } from "@/lib/types/api";
import type { PppoeRenewalInfo, PppoeRenewalPaymentStatus, PppoeRenewalPrompt } from "@/lib/types/pppoeRenewal";

/**
 * "Renew my internet" (public, no sign-in): a PPPoE customer renews by their account number.
 * `/api/v1/public/pppoe-renew/**` is permitAll in the backend: no Authorization header is sent.
 */
function path(accountNumber: string, rest = ""): string {
  return `/public/pppoe-renew/${encodeURIComponent(accountNumber.replace(/[\s-]/g, "").toUpperCase())}${rest}`;
}

export async function getPppoeRenewalInfoAction(accountNumber: string): Promise<ApiResponse<PppoeRenewalInfo>> {
  return apiFetch<PppoeRenewalInfo>(path(accountNumber), { auth: "public", cache: "no-store" });
}

export async function startPppoeRenewalPaymentAction(accountNumber: string, phoneNumber: string): Promise<ApiResponse<PppoeRenewalPrompt>> {
  return apiFetch<PppoeRenewalPrompt>(path(accountNumber, "/pay"), {
    method: "POST",
    body: { phoneNumber },
    auth: "public",
    // M-Pesa may take a while to accept the prompt
    timeoutMs: 45_000,
  });
}

export async function getPppoeRenewalPaymentAction(accountNumber: string, paymentId: string): Promise<ApiResponse<PppoeRenewalPaymentStatus>> {
  return apiFetch<PppoeRenewalPaymentStatus>(path(accountNumber, `/payments/${encodeURIComponent(paymentId)}`), {
    auth: "public",
    cache: "no-store",
  });
}
