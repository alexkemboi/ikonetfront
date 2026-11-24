import { http, HttpResponse } from "msw";
import { API_PREFIX, requireAuth } from "./auth-guard";
import {
  loginFixture,
  refreshTokenFixture,
  logoutFixture,
  accountTypeFixture,
} from "@/contracts/catalog";
import type { ApiMenuItem } from "@/lib/types/roles";

/**
 * Routes of the staff dashboard, grouped as the catalogue groups them. Test data
 * only: the real sidebar comes from GET /navigation/me (navigation_menus).
 */
const PERMISSIVE_ROUTES: { href: string; label: string; icon: string; children?: { href: string; label: string; icon: string }[] }[][] = [
  [{ href: "/dashboard/overview", label: "Overview", icon: "layout-dashboard" }],
  [
    { href: "/customers", label: "Subscribers", icon: "users", children: [{ href: "/customers/all", label: "Directory", icon: "users" }] },
    { href: "/portal/pppoe", label: "PPPoE Clients", icon: "wifi" },
  ],
  [
    { href: "/network/regions", label: "Regions", icon: "globe" },
    { href: "/network/locations", label: "Locations", icon: "map-pin" },
    { href: "/network/stations", label: "Stations/POPs", icon: "database" },
    { href: "/network/routers", label: "Routers (Edge)", icon: "server" },
    { href: "/network/routers/setup", label: "Link MikroTik", icon: "router" },
    { href: "/network/equipment", label: "Equipment", icon: "package" },
    { href: "/network/ip-pools", label: "IP Pools", icon: "database" },
    { href: "/network/ip-mappings", label: "IP Mappings", icon: "network" },
    { href: "/network/live-sessions", label: "Live Sessions", icon: "activity" },
  ],
  [{ href: "/communications/bulk-email", label: "SMS & Emails", icon: "mail" }],
  [{ href: "/customers/tickets", label: "Tickets", icon: "headphones" }],
  [
    { href: "/finance", label: "Executive Dashboard", icon: "bar-chart-3" },
    { href: "/finance/ledger", label: "Chart of Accounts", icon: "book-open" },
    { href: "/finance/expenses", label: "Expenses", icon: "receipt" },
    { href: "/finance/statements", label: "Statements", icon: "file-text" },
    { href: "/finance/vouchers", label: "Vouchers", icon: "credit-card" },
    { href: "/finance/reconciliation", label: "M-Pesa Reconciliation", icon: "rotate-cw" },
    { href: "/finance/investors", label: "Investors", icon: "users" },
    {
      href: "/finance/billing", label: "Billing", icon: "credit-card",
      children: [
        { href: "/finance/billing/payments", label: "Payments", icon: "credit-card" },
        { href: "/finance/billing/invoices", label: "Invoices", icon: "file-text" },
      ],
    },
  ],
  [{ href: "/analytics", label: "Analytics", icon: "bar-chart-3" }],
  [
    { href: "/system/companies", label: "Companies", icon: "building-2" },
    { href: "/system/packages", label: "Packages", icon: "package" },
    { href: "/system/users", label: "Users & Access Control", icon: "shield-check" },
    { href: "/system/audit", label: "Audit Logs", icon: "scroll-text" },
  ],
  [{ href: "/settings/alerts", label: "Alert Channels", icon: "bell" }],
];

/**
 * Permissive role-menu fixture for tests that exercise unrelated actions but
 * now depend on the API-driven permission map (the static fallback is gone).
 * Fail-closed tests override this with `server.use(... data: [])`.
 */
function permissiveMenuTree(): ApiMenuItem[] {
  return PERMISSIVE_ROUTES.flatMap((group, gi) =>
    group.map((item, i) => ({
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