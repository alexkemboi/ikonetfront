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
import { withPortalRouter, type PortalRouter } from '@/lib/hotspot/portalRouter';

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

/** Brand of the company whose router served the customer (`GET /hotspot/branding/portal-context`). */
export interface HotspotPortalContext {
  companyCode: string;
  companyName: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  supportPhone?: string | null;
  supportEmail?: string | null;
  routerVerified: boolean;
}

/**
 * Which company's hotspot is this? Resolved by the backend from the signed router id;
 * `routerIdentity` / `clientIp` / `company` only help routers that do not have their signed
 * login page yet. Null when no company can be resolved: the page then shows a neutral name.
 */
export async function getHotspotPortalContextAction(scope: {
  portalRouter?: PortalRouter | null;
  routerIdentity?: string;
  clientIp?: string;
  company?: string;
} = {}): Promise<HotspotPortalContext | null> {
  const query = new URLSearchParams();
  if (scope.routerIdentity) query.set("routerIdentity", scope.routerIdentity);
  if (scope.clientIp) query.set("clientIp", scope.clientIp);
  if (scope.company) query.set("company", scope.company);
  const path = query.size > 0 ? `/hotspot/branding/portal-context?${query.toString()}` : "/hotspot/branding/portal-context";
  const res = await apiFetch<HotspotPortalContext>(withPortalRouter(path, scope.portalRouter), {
    auth: 'public',
    cache: 'no-store',
  });
  return res.success && res.data?.companyName ? res.data : null;
}

export async function getPublicHotspotPackagesAction(scope: { routerIdentity?: string; clientIp?: string; companyId?: string; portalRouter?: PortalRouter | null } = {}): Promise<HotspotPackagesResponse> {
  const query = new URLSearchParams({ serviceType: "HOTSPOT" });
  if (scope.routerIdentity) query.set("routerIdentity", scope.routerIdentity);
  if (scope.clientIp) query.set("clientIp", scope.clientIp);
  if (scope.companyId) query.set("companyId", scope.companyId);
  // A signed router scopes the list to one company: never share that response between routers.
  const res = await apiFetch<HotspotPackage[]>(withPortalRouter(`/hotspot/packages?${query.toString()}`, scope.portalRouter), {
    auth: 'public',
    ...(scope.portalRouter ? { cache: 'no-store' as const } : { tags: ['hotspot-packages'], revalidate: 60 }),
  });
  return { ...res, data: res.data ?? [] };
}

/** Backward-compatible alias — see `getPublicHotspotPackagesAction`. */
export const getHotspotPackages = getPublicHotspotPackagesAction;

export async function initiateHotspotPayment(
  requestBody: InitiatePaymentRequest,
  portalRouter?: PortalRouter | null
): Promise<InitiatePaymentResponse> {
  const res = await apiFetch<HotspotSessionResponse>(withPortalRouter('/hotspot/initiate', portalRouter), {
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
  portalRouter?: PortalRouter | null;
}

export async function activateVoucherAction(
  request: ActivateVoucherRequest
): Promise<ApiResponse<HotspotSessionResponse | null>> {
  const res = await apiFetch<HotspotSessionResponse>(withPortalRouter('/hotspot/vouchers/activate', request.portalRouter), {
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
  ipAddress: string,
  portalRouter?: PortalRouter | null
): Promise<ReconnectResponse> {
  // Contract: `POST /api/v1/hotspot/reconnect` body `HotspotConnectRequest { macAddress, clientIp }`.
  const res = await apiFetch<ReconnectResponseData>(withPortalRouter('/hotspot/reconnect', portalRouter), {
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