/**
 * Shared types for the Ikonex Systems API auth layer.
 * Used by server actions, lib/auth.ts, and NextAuth callbacks.
 */

import type { ApiResponse as BaseApiResponse } from "@/lib/types/api";

/** Standard envelope returned by every API endpoint */
export type ApiResponse<T = unknown> = BaseApiResponse<T>;

/** Login endpoint response data */
export type LoginData = { token: string; username: string; role: string };

/**
 * Claims embedded in the JWT returned by the login endpoint.
 * Field names mirror the register schema — adjust if the API differs.
 */
export type JwtPayload = {
  sub?: string;
  userId?: string;
  username: string;
  email: string;
  role: string;
  fname: string;
  middleName?: string;
  otherName?: string;
  phoneNumber?: string;
  regionId?: number;
  stationId?: number;
  locationId?: number;
  investorScope?: string;
  companyScope?: string;
  companyId?: string;
  iat?: number;
  exp?: number;
};

export type LoginResponse = ApiResponse<{
  username: string;
  role: string;
  token: string;
  refreshToken?: string;
  expiresIn?: number;
}>;

export type AccountTypeResponse = {
  accountType: "CUSTOMER" | "SYSADMIN" | "INVALID";
};

/**
 * Refresh-token success payload. The backend keys refresh off the Bearer
 * access JWT (`Authorization: Bearer <oldJwt>`) and replies `{ token }`.
 */
export type RefreshTokenResponse = {
  token: string;
};