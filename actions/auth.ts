"use server";

import type { ApiResponse, LoginData } from "@/lib/types/auth";

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
  return res.json() as Promise<ApiResponse<LoginData>>;
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
    return res.json();
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
    return res.json();
  } catch {
    return { status: 500, success: false, message: "Network error. Please try again.", data: null, timestamp: "" };
  }
}
