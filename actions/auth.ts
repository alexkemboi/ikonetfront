"use server";

import type { ApiResponse, LoginData, RefreshTokenResponse, AccountTypeResponse } from "@/lib/types/auth";
import { apiFetch } from "@/lib/apiClient";
import { getBackendAccessToken } from "@/lib/authToken";
import { clientOriginHeaders } from "@/lib/clientOrigin";

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

/** @deprecated The server now decides the account type inside sign-in. */
export async function determineAccountTypeAction(username: string, password: string): Promise<ApiResponse<AccountTypeResponse>> {
  return apiFetch<AccountTypeResponse>("/auth/account-type", {
    method: "POST",
    body: { username, password },
    auth: "public",
    cache: "no-store",
  });
}

/** Sign-in answer: a token, or `codeRequired` when an emailed sign-in code must be entered next. */
export type SignInStep = LoginData & { refreshToken?: string; codeRequired?: boolean };

/**
 * The one sign-in for every account. The server finds the account from the username, email
 * or phone typed, works out whether it is a platform administrator, staff, an investor or a
 * customer, and answers with a token (or `codeRequired` when an emailed code comes next).
 */
export async function signInAction(identifier: string, password: string): Promise<ApiResponse<SignInStep>> {
  return apiFetch<SignInStep>("/auth/userlogin", {
    method: "POST",
    body: { username: identifier, password },
    auth: "public",
    headers: await clientOriginHeaders(),
    cache: "no-store",
  });
}

/** The one second step: the emailed code. `role` is what {@link signInAction} answered with. */
export async function signInCodeAction(identifier: string, code: string, role?: string): Promise<ApiResponse<SignInStep>> {
  return apiFetch<SignInStep>("/auth/userlogin/verify", {
    method: "POST",
    body: role ? { username: identifier, code, role } : { username: identifier, code },
    auth: "public",
    headers: await clientOriginHeaders(),
    cache: "no-store",
  });
}

/** @deprecated The sign-in page uses {@link signInAction}. Kept while the endpoints stay. */
export async function staffLoginAction(username: string, password: string, organisation?: string): Promise<ApiResponse<SignInStep>> {
  return apiFetch<SignInStep>("/auth/userlogin", {
    method: "POST",
    body: organisation ? { username, password, organisation } : { username, password },
    auth: "public",
    cache: "no-store",
  });
}

/** Company accounts, second step: the emailed sign-in code. */
export async function staffSignInCodeAction(username: string, code: string): Promise<ApiResponse<SignInStep>> {
  return apiFetch<SignInStep>("/auth/userlogin/verify", {
    method: "POST",
    body: { username, code },
    auth: "public",
    cache: "no-store",
  });
}

/** System administrators, second step: the emailed sign-in code. */
export async function sysAdminSignInCodeAction(username: string, code: string): Promise<ApiResponse<SignInStep>> {
  return apiFetch<SignInStep>("/auth/sysadminlogin/verify", {
    method: "POST",
    body: { username, otp: code },
    auth: "public",
    cache: "no-store",
  });
}

/**
 * System administrator sign-in. Returns the token, or `codeRequired` when the
 * server's auth.signin-code setting asks for an emailed code.
 */
export async function sysAdminLoginAction(username: string, password: string): Promise<ApiResponse<SignInStep>> {
  return apiFetch<SignInStep>("/auth/sysadminlogin", {
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
    headers: await clientOriginHeaders(),
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
    headers: await clientOriginHeaders(),
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

export async function logoutAction(): Promise<void> {
  try {
    const token = await getBackendAccessToken();
    if (!token) return;
    await apiFetch("/auth/logout", {
      method: "POST",
      authorization: `Bearer ${token}`,
    });
  } catch {
    // Silently fail — the session will be cleaned up client-side
  }
}