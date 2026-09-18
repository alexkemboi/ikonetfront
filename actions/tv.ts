"use server";

import { apiFetch } from "@/lib/apiClient";
import type { NetPackage } from "@/lib/types/api";
import type { TvPackage, TvPackagesResult } from "@/lib/types/tv";
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

/**
 * Map a backend `NetPackage` (category TV) to the UI `TvPackage` shape used by
 * the captive-portal picker. `validity` and `dataAllowance` are derived from the
 * package validity/bandwidth fields; raw packages are never shipped un-mapped.
 */
export function mapToTvPackage(net: NetPackage): TvPackage {
  const value = net.validityValue ?? 1;
  const rawType = (net.validityType ?? "day").toLowerCase();
  const singular = rawType.endsWith("s") ? rawType.slice(0, -1) : rawType;
  const validity = `${value} ${singular}${value === 1 ? "" : "s"}`;
  const unlimited = net.bandwidthType?.toUpperCase() === "UNLIMITED";
  return {
    idxno: net.idxno,
    packageName: net.packageName,
    price: net.price,
    validity,
    speedDownload: net.speedDownload ?? 0,
    speedUpload: net.speedUpload ?? 0,
    maxDevices: net.maxDevices ?? 1,
    dataAllowance: unlimited ? "Unlimited" : net.rateLimit || "Unlimited",
  };
}

const TV_CACHE_TAGS = ["hotspot-tv-packages"] as const;
const TV_REVALIDATE_SECONDS = 60;

/** Read-only, public, no admin JWT. `GET /hotspot/packages?category=TV`. */
export async function getTvPackagesAction(): Promise<TvPackagesResult> {
  try {
    const res = await apiFetch<NetPackage[]>("/hotspot/packages?category=TV", {
      method: "GET",
      auth: "public",
      tags: [...TV_CACHE_TAGS],
      revalidate: TV_REVALIDATE_SECONDS,
    });

    if (!res.success || !Array.isArray(res.data)) {
      console.error("getTvPackagesAction error:", res.message);
      return { packages: [] };
    }

    const packages = res.data
      .filter((net) => net.packageCategory === "TV")
      .map(mapToTvPackage);

    return { packages };
  } catch (error) {
    console.error("getTvPackagesAction error:", error);
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
