"use server";

/**
 * actions/pppoe.ts — PPPoE service actions for a customer who has a PPPoE
 * account: the package they are on, and the M-Pesa payment that renews it.
 *
 * These go through the backend's subscription engine, which is also what the
 * expiry job and the M-Pesa callback act on: assigning a package or receiving a
 * payment re-enables the customer in RADIUS and resets their session.
 */
import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/apiClient";
import type { ApiResponse } from "@/lib/types/api";

export type PppoePackage = {
  id: string;
  name: string;
  uploadSpeed: number | null;
  downloadSpeed: number | null;
  durationDays: number | null;
  price: number | null;
  mikrotikRateLimit: string | null;
};

export async function getPppoePackagesAction(): Promise<ApiResponse<PppoePackage[]>> {
  return apiFetch<PppoePackage[]>("/pppoe/packages", { auth: "required", cache: "no-store" });
}

function refreshCustomerLists() {
  revalidatePath("/portal/pppoe");
  revalidatePath("/customers/all");
}

/** Put the customer on a package. Starts (or restarts) their service for one package period. */
export async function assignPppoePackageAction(
  customerId: string,
  packageId: string
): Promise<ApiResponse<null>> {
  const res = await apiFetch<null>("/pppoe/subscriptions/activate", {
    method: "POST",
    body: { customerId, packageId },
    auth: "required",
    cache: "no-store",
  });
  if (res.success) refreshCustomerLists();
  return res;
}

/**
 * Send an M-Pesa payment prompt to the customer's phone. When they pay, the
 * backend renews the subscription and reconnects them without further action.
 */
export async function requestPppoePaymentAction(input: {
  customerId: string;
  phoneNumber: string;
  amount: number;
}): Promise<ApiResponse<null>> {
  return apiFetch<null>("/pppoe/payments/stk-push", {
    method: "POST",
    body: input,
    auth: "required",
    cache: "no-store",
  });
}
