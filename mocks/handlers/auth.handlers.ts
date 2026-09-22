import { http, HttpResponse } from "msw";
import { API_PREFIX, requireAuth } from "./auth-guard";
import {
  loginFixture,
  refreshTokenFixture,
  logoutFixture,
  accountTypeFixture,
} from "@/contracts/catalog";

export const authHandlers = [
  // Public: no Authorization expected.
  http.post(`${API_PREFIX}/auth/userlogin`, () =>
    HttpResponse.json(loginFixture(), { status: 200 })
  ),

  // Sysadmin direct-login bypass (OTP temporarily disabled).
  http.post(`${API_PREFIX}/auth/sysadminlogin`, () =>
    HttpResponse.json(
      {
        status: 200,
        success: true,
        message: "SysAdmin login successful",
        data: {
          username: "nicanornicolas",
          role: "SYSADMIN",
          token: "mock-sysadmin-jwt",
        },
        timestamp: "2026-08-26T00:00:00.000Z",
      },
      { status: 200 }
    )
  ),

  http.post(`${API_PREFIX}/auth/account-type`, () => {
    // Default to CUSTOMER unless overridden in tests via MSW handler overrides.
    return HttpResponse.json(accountTypeFixture(), { status: 200 });
  }),

  http.post(`${API_PREFIX}/auth/forgot-password`, () =>
    HttpResponse.json(
      { status: 200, success: true, message: "Reset link sent", data: null },
      { status: 200 }
    )
  ),

  http.post(`${API_PREFIX}/auth/reset-password`, () =>
    HttpResponse.json(
      { status: 200, success: true, message: "Password reset", data: null },
      { status: 200 }
    )
  ),

  // Role menu tree — returns empty so permission helpers fall back to static
  // nav config in tests (matches the "backend returns no menus" path).
  http.get(`${API_PREFIX}/system-setup/:roleCode/menus`, () =>
    HttpResponse.json(
      { status: 200, success: true, message: "OK", data: [] },
      { status: 200 }
    )
  ),

  // Bearer (old JWT) required.
  http.post(`${API_PREFIX}/auth/refresh-token`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(refreshTokenFixture(), { status: 200 });
  }),

  // Bearer required.
  http.post(`${API_PREFIX}/auth/logout`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(logoutFixture(), { status: 200 });
  }),
];