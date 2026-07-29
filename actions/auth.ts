"use server";

import type { ApiResponse, LoginData, RefreshTokenResponse } from "@/lib/types/auth";

const JSON_HEADERS = { "Content-Type": "application/json" };

export async function loginAction(credentials: {
  username: string;
  password: string;
}) {
  const res = await fetch(`${process.env.BASE_API_URL}auth/userlogin`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(credentials),
    cache: "no-store",
  });

  console.log("Login response:", res);
  const data = await res.json();
  return data as Promise<ApiResponse<LoginData>>;
}

export async function forgotPasswordAction(
  email: string
): Promise<ApiResponse<unknown>> {
  try {
    const res = await fetch(`${process.env.BASE_API_URL}auth/forgot-password`, {
      method:  "POST",
      headers: JSON_HEADERS,
      body:    JSON.stringify({ email }),
      cache:   "no-store",
    });
    const data = await res.json();
    return data;
  } catch {
    return { status: 500, success: false, message: "Network error. Please try again.", data: null, timestamp: "" };
  }
}

export async function resetPasswordAction(payload: {
  email:       string;
  otp:         string;
  newPassword: string;
}): Promise<ApiResponse<unknown>> {
  try {
    const res = await fetch(`${process.env.BASE_API_URL}auth/reset-password`, {
      method:  "POST",
      headers: JSON_HEADERS,
      body:    JSON.stringify(payload),
      cache:   "no-store",
    });
    const data = await res.json();
    return data;
  } catch {
    return { status: 500, success: false, message: "Network error. Please try again.", data: null, timestamp: "" };
  }
}

export async function refreshAccessToken(refreshToken: string): Promise<RefreshTokenResponse | null> {
  try {
    const response = await fetch(`${process.env.BASE_API_URL}auth/refresh-token`, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) return null;

    return await response.json();
  } catch {
    return null;
  }
}

export async function logoutAction(token: string): Promise<void> {
  try {
    await fetch(`${process.env.BASE_API_URL}auth/logout`, {
      method: "POST",
      headers: {
        ...JSON_HEADERS,
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    // Silently fail — the session will be cleaned up client-side
  }
}