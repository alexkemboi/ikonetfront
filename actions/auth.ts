"use server";

import type { ApiResponse, LoginData, RefreshTokenResponse, AccountTypeResponse } from "@/lib/types/auth";
import { apiFetch } from "@/lib/apiClient";

export async function loginAction(credentials: {
  username: string;
  password: string;
}): Promise<ApiResponse<LoginData & { refreshToken?: string }>> {
  return apiFetch<LoginData & { refreshToken?: string }>("/auth/userlogin", {
    method: "POST",
    body: credentials,
    auth: "public",
    cache: "no-store",
  });
}

export async function determineAccountTypeAction(username: string, password: string): Promise<ApiResponse<AccountTypeResponse>> {
  return apiFetch<AccountTypeResponse>("/auth/account-type", {
    method: "POST",
    body: { username, password },
    auth: "public",
    cache: "no-store",
  });
}

/**
 * Temporary sysadmin direct-login bypass (OTP paused).
 * Calls /auth/sysadminlogin which now returns the JWT directly.
 */
export async function sysAdminLoginAction(username: string, password: string): Promise<ApiResponse<LoginData & { refreshToken?: string }>> {
  return apiFetch<LoginData & { refreshToken?: string }>("/auth/sysadminlogin", {
    method: "POST",
    body: { username, password },
    auth: "public",
    cache: "no-store",
  });
}

export async function forgotPasswordAction(
  email: string
): Promise<ApiResponse<unknown>> {
  return apiFetch("/auth/forgot-password", {
    method: "POST",
    body: { email },
    auth: "public",
    cache: "no-store",
  });
}

export async function resetPasswordAction(payload: {
  email:       string;
  otp:         string;
  newPassword: string;
}): Promise<ApiResponse<unknown>> {
  return apiFetch("/auth/reset-password", {
    method: "POST",
    body: payload,
    auth: "public",
    cache: "no-store",
  });
}

/**
 * Refresh the backend access JWT.
 * Contract (verified): `POST /api/v1/auth/refresh-token` with
 * `Authorization: Bearer <oldJwt>`; reply envelope `ApiResponse<{ token }>`.
 * The backend keys refresh off the Bearer access JWT, NOT the `refreshToken`
 * captured at login (that field is stored for forward-compat only).
 */
export async function refreshAccessToken(
  currentJwt: string
): Promise<{ token: string } | null> {
  const res = await apiFetch<RefreshTokenResponse>("/auth/refresh-token", {
    method: "POST",
    body: {},
    authorization: `Bearer ${currentJwt}`,
    cache: "no-store",
  });
  if (!res.success || !res.data?.token) return null;
  return { token: res.data.token };
}

/**
 * Verify the operator's password and mint a 10-minute step-up token.
 * Contract: `POST /api/v1/auth/step-up/verify` with `Authorization: Bearer
 * <accessJwt>`; reply envelope `ApiResponse<{ token, expiresInSeconds,
 * expiresAt }>`. Server-only so `StepUpProvider` (a client component) never
 * imports `next/headers` through `apiClient`.
 */
export async function verifyStepUpAction(password: string): Promise<{
  token: string;
  expiresInSeconds: number;
  expiresAt: string;
} | null> {
  const res = await apiFetch<{
    token: string;
    expiresInSeconds: number;
    expiresAt: string;
  }>("/auth/step-up/verify", {
    method: "POST",
    body: { password },
    auth: "required",
    cache: "no-store",
  });
  if (!res.success || !res.data?.token) return null;
  return res.data;
}

export async function logoutAction(token: string): Promise<void> {
  try {
    await apiFetch("/auth/logout", {
      method: "POST",
      authorization: `Bearer ${token}`,
    });
  } catch {
    // Silently fail — the session will be cleaned up client-side
  }
}