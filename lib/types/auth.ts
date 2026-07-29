/**
 * Shared types for the Beesmart API auth layer.
 * Used by server actions, lib/auth.ts, and NextAuth callbacks.
 */

/** Standard envelope returned by every API endpoint */
export type ApiResponse<T = unknown> = {
  status: number;
  success: boolean;
  message: string;
  data: T | null | undefined;
  timestamp?: string;
};

/** Login endpoint response data */
export type LoginData = { token: string; username: string };

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

export type RefreshTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
};
