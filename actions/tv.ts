"use server";

import { tvDeviceSchema, type TvDeviceDetails } from "@/lib/validation/tv-device";

// Step 1 validates input only. It does not verify ownership, discover a device,
// activate internet, or make a payment. Add API integration here when ready.
export async function prepareTvDeviceAction(values: TvDeviceDetails): Promise<
  | { success: true; device: TvDeviceDetails }
  | { success: false; error: string }
> {
  try {
    const device = await tvDeviceSchema.validate(values, { stripUnknown: true });
    // TODO: API call for device verification, when the endpoint is available.
    return { success: true, device };
  } catch {
    return { success: false, error: "Check your TV’s MAC address and try again." };
  }
}

/** Called by the server page. Keep API fetching/mapping and cache tags here. */
export async function getTvPackagesAction(): Promise<import("@/lib/types/tv").TvPackagesResult> {
    // TODO: Call your TV packages API here and map its response to TvPackage[].
  // Scope the request to the company/router when wiring up the endpoint.
  // Add fetch cache tags here; mutations can invalidate them from server actions.
  // No hotspot-package fallback: only explicitly eligible TV plans belong here.
  try{
    const packages = await fetch(`${process.env.BASE_API_URL!}hotspot/packages`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      }})
    
      const data = await packages.json();
      if (!data.success || !Array.isArray(data.data)) {
        console.error("getTvPackagesAction error: Invalid response format", data);
        return { packages: [] };
      }
      return { packages: data.data };
  }catch (e){
    console.error("getTvPackagesAction error:", e);
    return { packages: [] };
  }

}

/** Payment integration placeholder. Never reports a payment as sent or successful. */
export async function initiateTvPaymentAction(values: import("@/lib/validation/tv-payment").TvPaymentRequest) {
  const { tvPaymentSchema } = await import("@/lib/validation/tv-payment");
  try {
    await tvPaymentSchema.validate(values, { stripUnknown: true });
  } catch {
    return { success: false as const, message: "Check the TV address, package and M-Pesa number." };
  }
  // TODO: Re-fetch the selected package server-side, verify company/router
  // eligibility, and resolve the current price. Never accept a browser amount.
  // TODO: Call your payment API with the validated/normalized request here.
  // Wire idempotency and transaction status before enabling payment retries.
  return { success: false as const, message: "TV payments are not available yet. No payment request was sent and you have not been charged." };
}
