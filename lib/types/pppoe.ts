/**
 * lib/types/pppoe.ts — PPPoE domain DTOs, mirrored from the live spec
 * (api-docs.json) `PppoePackageResponse`, `PppoeAccountResponse`,
 * `PppoeSubscriptionResponse`, request types. IDs are string UUIDs; account
 * status enum ACTIVE|SUSPENDED|DISABLED; subscription status enum
 * ACTIVE|EXPIRED|SUSPENDED|CANCELLED.
 */
import type { ApiResponse } from "@/lib/types/api";

export interface PppoePackageResponse {
  id: string;
  name: string;
  uploadSpeed: number;
  downloadSpeed: number;
  durationDays: number;
  mikrotikRateLimit?: string;
  maxDevices?: number;
  idleTimeoutSeconds?: number;
  acctInterimIntervalSeconds?: number;
  dataCapMb?: number;
  loginTimeWindow?: string;
}

export interface PppoePackageRequest {
  name: string;
  uploadSpeed: number;
  downloadSpeed: number;
  durationDays: number;
  mikrotikRateLimit?: string;
  maxDevices?: number;
  idleTimeoutSeconds?: number;
  acctInterimIntervalSeconds?: number;
  dataCapMb?: number;
  loginTimeWindow?: string;
}

export type PppoeAccountStatus = "ACTIVE" | "SUSPENDED" | "DISABLED";

export interface PppoeAccountResponse {
  id: string;
  customerId: string;
  username: string;
  generatedPassword?: string;
  routerId?: string;
  networkDeviceId?: number;
  routerIp?: string;
  physicalLocation?: string;
  status: PppoeAccountStatus;
  stationId?: string;
  companyId?: string;
}

export interface PppoeAccountRequest {
  customerId: string;
  username: string;
  password?: string;
  routerId?: string;
  networkDeviceId?: number;
  routerIp?: string;
  physicalLocation?: string;
  routerUsername?: string;
  routerPassword?: string;
  stationId?: string;
  companyId?: string;
}

export type PppoeSubscriptionStatus = "ACTIVE" | "EXPIRED" | "SUSPENDED" | "CANCELLED";

export interface PppoeSubscriptionResponse {
  id: string;
  customerId: string;
  accountId: string;
  packageId: string;
  packageName: string;
  startDate: string;
  expiryDate: string;
  daysRemaining: number;
  status: PppoeSubscriptionStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AssignPackageRequest {
  customerId: string;
  packageId: string;
  accountId: string;
}

export interface PppoePaymentRequest {
  customerId: string;
  phoneNumber: string;
  amount: number;
  accountId?: string;
  subscriptionId?: string;
}

export interface RadiusAuthResponse {
  result: string;
  reason: string;
  mikrotikRateLimit?: string;
  routerIp?: string;
}

export type PppoePackagesResponse = ApiResponse<PppoePackageResponse[]>;
export type PppoeAccountResponseEnvelope = ApiResponse<PppoeAccountResponse>;
export type PppoeAccountsResponse = ApiResponse<PppoeAccountResponse[]>;
export type PppoeSubscriptionsResponse = ApiResponse<PppoeSubscriptionResponse[]>;