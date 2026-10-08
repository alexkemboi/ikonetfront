import type {
  HotspotVoucherStatusApiResponse,
  InitiatePaymentRequest,
  InitiatePaymentResponse,
} from "@/lib/types/hotspot";

import { getPortalRouter, withPortalRouter } from "@/lib/hotspot/portalRouter";

const API_PATH = "/api/v1";

export const PENDING_HOTSPOT_PURCHASE_KEY = "hotspot.pendingPurchase";

function apiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_IBS_API_URL?.trim();
  if (!configured) {
    throw new Error("The hotspot payment service is not configured. Please contact support.");
  }

  return configured.replace(/\/+$/, "").replace(/\/api\/v1$/, "");
}

function publicUrl(path: string): string {
  return `${apiBaseUrl()}${API_PATH}${path}`;
}

async function publicJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(publicUrl(path), {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const body = await response.json().catch(() => null);

  if (body && typeof body === "object") return body as T;
  throw new Error(`Hotspot service request failed (HTTP ${response.status}).`);
}

/** Browser-only, unauthenticated captive-portal endpoints. */
export function initiatePublicHotspotPayment(
  request: InitiatePaymentRequest
): Promise<InitiatePaymentResponse> {
  // the signed router id of the page the customer arrived on decides the company
  return publicJson<InitiatePaymentResponse>(withPortalRouter("/hotspot/initiate", getPortalRouter()), {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export function getPublicVoucherStatus(
  voucherCode: string
): Promise<HotspotVoucherStatusApiResponse> {
  // carries the signed router id like every other portal call, so the lookup runs
  // under that router's company (without it the backend has no company to look in)
  return publicJson<HotspotVoucherStatusApiResponse>(
    withPortalRouter(`/hotspot/vouchers/${encodeURIComponent(voucherCode)}`, getPortalRouter())
  );
}
