"use server";

import { apiFetch } from "@/lib/apiClient";
import type { TvPackage, TvPackageOptionResponse, TvPackagesResult, TvPortalSession } from "@/lib/types/tv";
import { tvDeviceSchema, type TvDeviceDetails } from "@/lib/validation/tv-device";
import { withPortalRouter, type PortalRouter } from "@/lib/hotspot/portalRouter";

/** A device on the customer's hotspot. The full MAC stays on the server; the token stands in for it. */
export interface TvNearbyDevice {
  hostname: string;
  maskedMac: string;
  deviceToken: string;
}

/** Devices connected to the same hotspot router, for picking the TV instead of typing its MAC. */
export async function getNearbyTvDevicesAction(clientIp?: string | null, portalRouter?: PortalRouter | null): Promise<
  { devices: TvNearbyDevice[]; error?: string }
> {
  const path = clientIp?.trim() ? `/tv/devices/nearby?ip=${encodeURIComponent(clientIp.trim())}` : "/tv/devices/nearby";
  const result = await apiFetch<TvNearbyDevice[]>(withPortalRouter(path, portalRouter), { auth: "public", cache: "no-store" });
  if (!result.success || !result.data) {
    return { devices: [], error: "We couldn’t list the devices on this Wi-Fi. Enter the address from your TV’s settings." };
  }
  return { devices: result.data };
}

/**
 * Verifies the TV. With `deviceToken` (a device picked from the nearby list) the MAC is not
 * typed: the backend takes it from the token and returns it for the confirmation step.
 */
export async function prepareTvDeviceAction(values: TvDeviceDetails, portalRouter?: PortalRouter | null, deviceToken?: string): Promise<
  | { success: true; device: TvDeviceDetails; portal: TvPortalSession; recommendedPackages: TvPackage[]; warnings: string[] }
  | { success: false; error: string }
> {
  try {
    const device = deviceToken
      ? { ...(await tvDeviceSchema.pick(["customerPhone"]).validate(values, { stripUnknown: true })), macAddress: undefined }
      : await tvDeviceSchema.validate(values, { stripUnknown: true });
    const verification = await apiFetch<TvDeviceVerification>(withPortalRouter("/tv/devices/verify", portalRouter), {
      method: "POST",
      body: deviceToken
        ? { customerPhone: device.customerPhone, deviceToken, routerIdentity: values.routerIdentity }
        : { customerPhone: device.customerPhone, macAddress: device.macAddress, routerIdentity: values.routerIdentity },
      auth: "public",
      cache: "no-store",
    });
    if (!verification.success || !verification.data?.eligible) {
      // the backend puts its error code in `message` and the sentence for the customer in `data.detail`
      const detail = (verification.data as { detail?: string } | null | undefined)?.detail;
      return { success: false, error: detail || verification.message || "This TV is not eligible for activation." };
    }
    return {
      success: true,
      device: { macAddress: verification.data.normalizedMac, customerPhone: verification.data.normalizedPhone },
      portal: {
        portalToken: verification.data.portalToken,
        portalTokenExpiresAt: verification.data.portalTokenExpiresAt,
        companyCode: verification.data.companyCode,
        stationId: verification.data.stationId,
        normalizedPhone: verification.data.normalizedPhone,
        normalizedMac: verification.data.normalizedMac,
        routerIdentity: values.routerIdentity ?? null,
      },
      recommendedPackages: verification.data.recommendedPackages.map(mapEligiblePackage),
      warnings: verification.data.softWarnings,
    };
  } catch {
    return { success: false, error: deviceToken ? "Check your phone number and try again." : "Check your TV’s MAC address and try again." };
  }
}

export interface TvDeviceVerification {
  eligible: boolean;
  recommendedPackages: TvPackageOptionResponse[];
  softWarnings: string[];
  portalToken: string;
  portalTokenExpiresAt: string;
  companyCode: string;
  stationId: string | null;
  normalizedPhone: string;
  normalizedMac: string;
  existingCustomer: unknown;
  nearestStationId: number | null;
}

function mapEligiblePackage(option: TvPackageOptionResponse): TvPackage {
  const speeds = option.speedLabel?.match(/[\d.]+/g)?.map(Number) ?? [];
  return {
    idxno: option.packageId,
    packageName: option.name,
    price: option.price,
    validity: option.validityLabel,
    speedDownload: speeds[0] ?? 0,
    speedUpload: speeds[1] ?? 0,
    speedLabel: option.speedLabel,
    maxDevices: 1,
    dataAllowance: option.notes ?? "—",
    availableForDevice: option.availableForDevice,
    unavailableReason: option.unavailableReason,
  };
}

/** Load TV-only eligible packages with the portal token issued by verification. */
export async function getEligibleTvPackagesAction(portalToken: string, macAddress: string): Promise<TvPackagesResult> {
  const query = new URLSearchParams({ macAddress });
  const result = await apiFetch<TvPackageOptionResponse[]>(`/tv/packages/eligible?${query}`, {
    auth: "public",
    headers: { "X-TV-Portal-Token": portalToken },
    cache: "no-store",
  });
  if (!result.success || !result.data) return { packages: [], error: result.message };
  return { packages: result.data.map(mapEligiblePackage) };
}

export async function initiateTvPaymentAction(values: import("@/lib/validation/tv-payment").TvPaymentRequest, portalRouter?: PortalRouter | null) {
  const { tvPaymentSchema } = await import("@/lib/validation/tv-payment");
  try {
    await tvPaymentSchema.validate(values, { stripUnknown: true });
  } catch {
    return { success: false as const, message: "Check the TV address, package and M-Pesa number." };
  }
  const idempotencyKey = values.idempotencyKey ?? crypto.randomUUID();
  if (!values.portalToken) return { success: false as const, message: "The TV setup session expired. Verify the device again.", transactionReference: null };
  const result = await apiFetch<TvPaymentInitiateResponse>(withPortalRouter("/tv/payments/initiate", portalRouter), {
    method: "POST",
    body: {
      phone: values.phone,
      customerPhone: values.customerPhone,
      macAddress: values.macAddress,
      packageId: Number(values.packageId),
      submittedAmount: String(values.submittedAmount ?? "0"),
    },
    auth: "public",
    headers: { "X-TV-Portal-Token": values.portalToken, "Idempotency-Key": idempotencyKey },
    cache: "no-store",
  });
  if (!result.success) {
    const data = (result.data ?? {}) as Partial<TvPaymentInitiateResponse> & { code?: string; serverAmount?: string; statusUrl?: string; transactionReference?: string; retryAfterSeconds?: number };
    return { success: false as const, message: result.message, code: data.code ?? result.message, serverAmount: data.serverAmount, statusUrl: data.statusUrl, transactionReference: data.transactionReference, retryAfterSeconds: data.retryAfterSeconds, requestId: result.requestId, idempotencyKey };
  }
  if (!result.data) {
    return { success: false as const, message: "Payment response was empty.", transactionReference: null };
  }
  return {
    success: true as const,
    message: result.data.validationOutcome.message || "Payment request sent. Check your phone.",
    transactionReference: result.data.transactionReference,
    status: result.data.validationOutcome.valid ? "PENDING" : "AMOUNT_MISMATCH",
    serverAmount: result.data.validationOutcome.serverAmount,
    idempotencyKey,
    mpesaStkPushTriggered: result.data.mpesaStkPushTriggered,
    statusUrl: result.data.statusUrl,
  };
}

export async function getTvPaymentStatusAction(transactionReference: string, portalToken: string) {
  const result = await apiFetch<TvPaymentStatusResponse>(
    `/tv/payments/${encodeURIComponent(transactionReference)}/status`,
    { auth: "public", headers: { "X-TV-Portal-Token": portalToken }, cache: "no-store" }
  );
  return result.success && result.data ? { success: true as const, data: result.data, requestId: result.requestId } : { success: false as const, message: result.message, requestId: result.requestId };
}

interface TvPaymentInitiateResponse {
  transactionReference: string;
  mpesaStkPushTriggered: boolean;
  statusUrl: string;
  replayed: boolean;
  validationOutcome: { valid: boolean; serverAmount: string; currency: string; message: string | null };
}

interface TvPaymentStatusResponse {
  transactionReference: string;
  state: "PENDING" | "SETTLED" | "FAILED" | "TIMED_OUT";
  provisioningState: "NOT_APPLICABLE" | "PENDING" | "PROVISIONED" | "RETRYING" | "PARKED";
  settledAt: string | null;
  failedReason: string | null;
  provisionedAt: string | null;
  provisioningAttempts: number;
  provisioningFailureCode: string | null;
  pendingReason: "STK_OUTCOME_UNKNOWN" | "UNDER_REVIEW" | null;
  supportReference: string | null;
  mpesaReceipt: string | null;
  amount: string;
  currency: "KES";
  tvEntitlementExpiresAt: string | null;
}
