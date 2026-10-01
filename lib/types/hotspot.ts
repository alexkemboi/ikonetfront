import type { ApiResponse, NetPackage } from "@/lib/types/api";

export interface HotspotPackage extends Omit<NetPackage, "price"> {
  price: string;
  enableBurst: boolean;
  burstLimit: string;
  burstThreshold: string;
  burstTime: string;
  dateCreated: string;
  createdBy: string;
  approvedBy: string | null;
  isApproved: boolean;
}

export type HotspotPackagesResponse = ApiResponse<HotspotPackage[]>;

export interface InitiatePaymentRequest {
  packageId: number;
  phone: string;
  paymentMode: string;
  macAddress: string;
  clientMac: string;
  clientIp: string;
  /** RouterOS identity of the serving router; required once several routers are active. */
  routerIdentity?: string;
  companyId?: string;
}

/**
 * `HotspotSessionResponse` — verified backend envelope fields from
 * `POST /api/v1/hotspot/initiate` (201).
 */
export interface HotspotSessionResponse {
  sessionId: string;
  macAddress: string;
  clientPhone: string;
  payerPhone: string;
  packageName: string;
  amountPaid: number;
  sessionStatus: string;
  startedAt: string;
  expiresAt: string;
  minutesRemaining: number;
  mpesaReference: string;
  voucherCode: string;
  concurrentUserLimit?: number;
  durationSeconds?: number;
  dataUploadedBytes?: number;
  dataDownloadedBytes?: number;
  ipAddress?: string;
  stationId?: string;
  companyId?: string;
}

export type InitiatePaymentResponse = ApiResponse<HotspotSessionResponse>;

/** Public voucher status returned while a captive-portal payment settles. */
export type HotspotVoucherStatus = "PENDING" | "ACTIVE" | "FAILED";

export interface HotspotVoucherStatusResponse {
  sessionId: string | number;
  sessionStatus: HotspotVoucherStatus;
  voucherCode: string;
  expiresAt?: string;
  minutesRemaining: number;
  packageName: string;
  amountPaid: number;
  mpesaReference?: string;
  macAddress?: string;
  clientMac?: string;
  clientIp?: string;
  dataUploadedBytes?: number;
  dataDownloadedBytes?: number;
}

export type HotspotVoucherStatusApiResponse = ApiResponse<HotspotVoucherStatusResponse>;

/** The minimum state needed to resume a payment status check in this tab. */
export interface PendingHotspotPurchase {
  sessionId: string | number;
  voucherCode: string;
  startedAt: number;
}

export interface ReconnectResponseData {
  hasActiveSession: boolean;
  message: string;
  session: HotspotSessionResponse | null;
}

export type ReconnectResponse = ApiResponse<ReconnectResponseData>;

export interface HotspotState {
  packages: HotspotPackage[];
  selectedPackage: HotspotPackage | null;
  paymentStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  paymentMessage: string | null;
  hasActiveSession: boolean;
  sessionMessage: string | null;
}
