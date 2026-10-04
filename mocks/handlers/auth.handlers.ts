import { http, HttpResponse } from "msw";
import { API_PREFIX, requireAuth } from "./auth-guard";
import {
  loginFixture,
  refreshTokenFixture,
  logoutFixture,
  accountTypeFixture,
} from "@/contracts/catalog";
import { adminNavGroups } from "@/config/nav-admin";
import type { ApiMenuItem } from "@/lib/types/roles";

/**
 * Permissive role-menu fixture for tests that exercise unrelated actions but
 * now depend on the API-driven permission map (the static fallback is gone).
 * Fail-closed tests override this with `server.use(... data: [])`.
 */
function permissiveMenuTree(): ApiMenuItem[] {
  return adminNavGroups.flatMap((group, gi) =>
    group.items.map((item, i) => ({
      idxno: gi * 1000 + i + 1,
      label: item.label,
      route: item.href,
      icon: item.icon,
      sortOrder: (gi * 100 + i + 1) * 10,
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      children: (item.children ?? []).map((child, j) => ({
        idxno: gi * 1000 + 500 + i * 10 + j,
        label: child.label,
        route: child.href,
        icon: child.icon,
        sortOrder: (j + 1) * 10,
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: true,
        children: [],
      })),
    }))
  );
}

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

  // Role menu tree — now the single source of nav/permissions, so unrelated
  // action tests get a permissive tree (fail-closed tests override with
  // `server.use` returning `data: []`).
  http.get(`${API_PREFIX}/system-setup/:roleCode/menus`, () =>
    HttpResponse.json(
      { status: 200, success: true, message: "OK", data: permissiveMenuTree() },
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