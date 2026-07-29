"use server";

import type { ApiResponse, LoginData } from "@/lib/types/auth";
import { JWT } from "next-auth/jwt";
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


export async function refreshAccessToken(token: JWT) {
  try {
    const response = await fetch("YOUR_BACKEND_REFRESH_URL", {
      method: "POST",
      body: JSON.stringify({ refresh_token: token.refreshToken }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) throw refreshedTokens;

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      expiresAt: Date.now() + (refreshedTokens.expires_in * 1000),
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    // Return the error so the token becomes "invalid"
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}