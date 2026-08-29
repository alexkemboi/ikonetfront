import type { ApiResponse, NetPackage } from "@/lib/types/api";

export interface HotspotPackage extends NetPackage {
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
}

export type InitiatePaymentResponse = ApiResponse<HotspotSessionResponse>;

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