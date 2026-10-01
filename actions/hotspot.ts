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

export async function getPublicHotspotPackagesAction(scope: { routerIdentity?: string; clientIp?: string; companyId?: string } = {}): Promise<HotspotPackagesResponse> {
  const query = new URLSearchParams({ serviceType: "HOTSPOT" });
  if (scope.routerIdentity) query.set("routerIdentity", scope.routerIdentity);
  if (scope.clientIp) query.set("clientIp", scope.clientIp);
  if (scope.companyId) query.set("companyId", scope.companyId);
  const res = await apiFetch<HotspotPackage[]>(`/hotspot/packages?${query.toString()}`, {
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
 * Voucher activation — `POST /api/v1/hotspot/vouchers/activate` (permitAll).
 *
 * Body `VoucherActivationRequest { voucherCode, macAddress, clientIp, routerIdentity }`.
 * The backend binds the voucher to this device's MAC (recovering it from the
 * router by `clientIp` when the CNA stripped `mac`), starts the validity clock on
 * first use, writes the RADIUS rows and auto-logs the device in on the serving
 * router. Errors come back as readable envelopes (404 unknown code, 409 bound to
 * another device, 410 expired/revoked, 403 voucher of another provider).
 */
export interface ActivateVoucherRequest {
  voucherCode: string;
  macAddress?: string;
  clientIp?: string;
  routerIdentity?: string;
}

export async function activateVoucherAction(
  request: ActivateVoucherRequest
): Promise<ApiResponse<HotspotSessionResponse | null>> {
  const res = await apiFetch<HotspotSessionResponse>('/hotspot/vouchers/activate', {
    method: 'POST',
    body: {
      voucherCode: request.voucherCode.trim().toUpperCase(),
      macAddress: request.macAddress?.trim() || undefined,
      clientIp: request.clientIp?.trim() || undefined,
      routerIdentity: request.routerIdentity?.trim() || undefined,
    },
    auth: 'public',
  });
  return { ...res, data: res.data ?? null };
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