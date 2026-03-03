"use server";

import type { ApiResponse, LoginData } from "@/lib/types/auth";

export async function loginAction(credentials: {
  username: string;
  password: string;
}) {
  const res = await fetch(`${process.env.BASE_API_URL}auth/userlogin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
    cache: "no-store",
  });
  return res.json() as Promise<ApiResponse<LoginData>>;
}
