'use server';

import { revalidateTag } from 'next/cache';
import type {
  HotspotPackagesResponse,
  HotspotPackage,
  InitiatePaymentRequest,
  InitiatePaymentResponse,
  HotspotSessionResponse,
  ReconnectResponse,
  ReconnectResponseData,
} from '@/lib/types/hotspot';
import type { ApiResponse } from '@/lib/types/api';
import { apiFetch } from '@/lib/apiClient';

/**
 * Public hotspot portal actions.
 *
 * These routes live under `/api/v1/hotspot/**` + `/api/v1/system/**`, which the
 * backend SecurityConfig marks `permitAll` for the public (captive-portal)
 * subset — NO Authorization header may be attached here (an admin JWT on a
 * captive portal would be both wrong scoped and potentially exposed to
 * unauthenticated users).
 *
 * Contract (verified 2026-08-29): `GET /api/v1/hotspot/packages` is served by
 * `HotspotPublicController` and returns `ApiResponse<List<NetPackageResponse>>`
 * (the captive-portal active-package landing). BE-AAA-042 shipped — this is the
 * endpoint per plan decision D2.
 */

export async function getPublicHotspotPackagesAction(): Promise<HotspotPackagesResponse> {
  const res = await apiFetch<HotspotPackage[]>('/hotspot/packages', {
    auth: 'public',
    tags: ['hotspot-packages'],
    revalidate: 60,
  });
  return { ...res, data: res.data ?? [] };
}

/** Backward-compatible alias — see `getPublicHotspotPackagesAction`. */
export const getHotspotPackages = getPublicHotspotPackagesAction;

export async function initiateHotspotPayment(
  requestBody: InitiatePaymentRequest
): Promise<InitiatePaymentResponse> {
  const res = await apiFetch<HotspotSessionResponse>('/hotspot/initiate', {
    method: 'POST',
    body: requestBody,
    auth: 'public',
  });

  if (!res.success) {
    return { ...res, data: null };
  }

  revalidateTag('hotspot-packages', 'page');
  return { ...res, data: res.data ?? null };
}

/**
 * Voucher activation — TEMPORARILY GATED OFF.
 *
 * The backend has no `POST /hotspot/activate` mapping in HotspotController /
 * HotspotSessionController (BE gap ticket; endpoint exists only in OpenAPI
 * docs). Keep the action returning a readable envelope so the UI can explain
 * the state instead of 404ing. Re-enable once the backend route lands.
 */
export async function activateVoucherAction(code: string): Promise<ApiResponse<null>> {
  void code;
  return {
    status: 503,
    success: false,
    message:
      "Voucher activation is temporarily unavailable — pending the backend route (POST /hotspot/activate) being verified. Tier-2 BE ticket.",
    data: null,
    timestamp: new Date().toISOString(),
  };
}

export async function checkActiveSession(
  macAddress: string,
  ipAddress: string
): Promise<ReconnectResponse> {
  // Contract: `POST /api/v1/hotspot/reconnect` body `HotspotConnectRequest { macAddress, clientIp }`.
  const res = await apiFetch<ReconnectResponseData>('/hotspot/reconnect', {
    method: 'POST',
    body: { macAddress, clientIp: ipAddress },
    auth: 'public',
  });

  if (!res.success) {
    return {
      ...res,
      data: {
        hasActiveSession: false,
        message: res.message,
        session: null,
      },
    };
  }

  return {
    ...res,
    data: res.data ?? {
      hasActiveSession: false,
      message: res.message,
      session: null,
    },
  };
}