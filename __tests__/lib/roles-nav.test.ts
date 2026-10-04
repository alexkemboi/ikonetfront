import { describe, it, expect, vi, beforeEach } from "vitest";
import { server } from "@/mocks/server";
import { http, HttpResponse } from "msw";
import { API_PREFIX } from "@/mocks/handlers/auth-guard";
import {
  normalizeRole,
  getLandingRouteForRole,
  roleNameToCode,
  ROLE_NAME,
  ROLE_CODE,
  type ApiMenuItem,
} from "@/lib/types/roles";
import {
  normalizeMenuRoute,
  extractPermissions,
  apiMenusToMenuTree,
  apiMenusToNavGroups,
  getPermissionForRoute,
  getCurrentUserPermissions,
  getStaticNavForRole,
  getNavLayoutForRole,
  filterNavByPermissions,
} from "@/lib/data/nav";
import { resolveDashboardPathForRole } from "@/lib/utils/dashboardRouting";
import { auth } from "@/lib/auth";

const mockedAuth = vi.mocked(auth);

const menuItem = (overrides: Partial<ApiMenuItem>): ApiMenuItem => ({
  idxno: 1,
  label: "Item",
  route: "/unknown",
  icon: "dashboard",
  sortOrder: 1,
  canView: true,
  canCreate: true,
  canEdit: true,
  canDelete: true,
  children: [],
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  mockedAuth.mockResolvedValue({
    user: {
      id: "1",
      name: "Test User",
      email: "test@example.com",
      role: "SYSADMIN",
      apiToken: "mock-valid-bearer-token",
      refreshToken: "mock-refresh-token",
      regionId: 1,
      stationId: 2,
      locationId: 3,
    },
  } as never);
});

describe("role normalization (lib/types/roles.ts)", () => {
  it("maps numeric codes 01→05 to canonical names", () => {
    expect(normalizeRole("01")).toBe(ROLE_NAME.ADMIN);
    expect(normalizeRole("02")).toBe(ROLE_NAME.MANAGEMENT);
    expect(normalizeRole("03")).toBe(ROLE_NAME.STAFF);
    expect(normalizeRole("04")).toBe(ROLE_NAME.INVESTOR);
    expect(normalizeRole("05")).toBe(ROLE_NAME.CUSTOMER);
  });

  it("handles authority-style aliases", () => {
    expect(normalizeRole("ROLE_INVESTOR")).toBe(ROLE_NAME.INVESTOR);
    expect(normalizeRole("ROLE_CUSTOMER")).toBe(ROLE_NAME.CUSTOMER);
    expect(normalizeRole("ROLE_SYSADMIN")).toBe(ROLE_NAME.ADMIN);
    expect(normalizeRole("ROLE_LEGACY_ADMIN")).toBe(ROLE_NAME.ADMIN);
    expect(normalizeRole("ROLE_STAFF_ADMIN")).toBe(ROLE_NAME.MANAGEMENT);
    expect(normalizeRole("SYSADMIN")).toBe(ROLE_NAME.ADMIN);
  });

  it("returns UNKNOWN for falsy/unknown roles (fail closed, no STAFF default)", () => {
    expect(normalizeRole(undefined)).toBe(ROLE_NAME.UNKNOWN);
    expect(normalizeRole("")).toBe(ROLE_NAME.UNKNOWN);
    expect(normalizeRole("SCI-FI_ROLE")).toBe(ROLE_NAME.UNKNOWN);
  });

  it("roleNameToCode round-trips known roles and returns empty for unknown", () => {
    expect(roleNameToCode(ROLE_NAME.INVESTOR)).toBe("04");
    expect(roleNameToCode(ROLE_NAME.CUSTOMER)).toBe("05");
    expect(roleNameToCode("ROLE_INVESTOR")).toBe(ROLE_CODE.INVESTOR);
    expect(roleNameToCode("unsupported")).toBe("");
  });
});

describe("landing route dispatch", () => {
  it("returns the canonical landing route per role", () => {
    expect(getLandingRouteForRole(ROLE_NAME.ADMIN)).toBe("/dashboard/overview");
    expect(getLandingRouteForRole(ROLE_NAME.MANAGEMENT)).toBe("/analytics");
    expect(getLandingRouteForRole(ROLE_NAME.STAFF)).toBe("/customers");
    expect(getLandingRouteForRole(ROLE_NAME.INVESTOR)).toBe("/finance/investor");
    expect(getLandingRouteForRole(ROLE_NAME.CUSTOMER)).toBe("/portal/pppoe");
  });

  it("investor 04/ROLE_INVESTOR dispatches to /finance/investor, never staff/customer", () => {
    expect(getLandingRouteForRole("04")).toBe("/finance/investor");
    expect(getLandingRouteForRole("ROLE_INVESTOR")).toBe("/finance/investor");
    expect(getLandingRouteForRole("04")).not.toBe("/customers");
    expect(getLandingRouteForRole("04")).not.toBe("/portal/pppoe");
  });

  it("resolveDashboardPathForRole uses the same helper (legacy routing cannot diverge)", () => {
    expect(resolveDashboardPathForRole("04")).toBe("/finance/investor");
    expect(resolveDashboardPathForRole("ROLE_INVESTOR")).toBe("/finance/investor");
    expect(resolveDashboardPathForRole("02")).toBe("/analytics");
    expect(resolveDashboardPathForRole(null)).toBe("/no-access");
  });

  it("unknown/falsy roles dispatch to the unguarded no-access route (no redirect loop)", () => {
    expect(getLandingRouteForRole("SCI-FI_ROLE")).toBe("/no-access");
    expect(getLandingRouteForRole(null)).toBe("/no-access");
    expect(getLandingRouteForRole(undefined)).toBe("/no-access");
  });
});

describe("normalizeMenuRoute (lib/data/nav.ts)", () => {
  it("normalizes dashboard aliases to canonical routes", () => {
    expect(normalizeMenuRoute("/dashboard/admin")).toBe("/dashboard/overview");
    expect(normalizeMenuRoute("/dashboard/management")).toBe("/analytics");
    expect(normalizeMenuRoute("/dashboard/staff")).toBe("/customers");
    expect(normalizeMenuRoute("/dashboard/customer")).toBe("/portal/pppoe");
  });

  it("normalizes packages aliases", () => {
    expect(normalizeMenuRoute("/finance/packages")).toBe("/system/packages");
    expect(normalizeMenuRoute("/packages")).toBe("/system/packages");
    expect(normalizeMenuRoute("/system/internet-packages")).toBe("/system/packages");
  });

  it("normalizes customer/network/finance/investor aliases", () => {
    expect(normalizeMenuRoute("/customers/active")).toBe("/customers/all");
    expect(normalizeMenuRoute("/customers/directory")).toBe("/customers/all");
    expect(normalizeMenuRoute("/customers/ip-bindings")).toBe("/customers/bindings");
    expect(normalizeMenuRoute("/network/ip-mapping")).toBe("/customers/bindings");
    expect(normalizeMenuRoute("/customers/pppoe")).toBe("/portal/pppoe");
    expect(normalizeMenuRoute("/network/microtick")).toBe("/network/mikrotik");
    expect(normalizeMenuRoute("/finance/coa")).toBe("/finance/ledger");
    expect(normalizeMenuRoute("/finance/payments")).toBe("/finance/billing/payments");
    expect(normalizeMenuRoute("/finance/invoices")).toBe("/finance/billing/invoices");
    expect(normalizeMenuRoute("/investor/dashboard")).toBe("/finance/investor");
  });

  it("leaves unknown canonical routes untouched and tolerates whitespace", () => {
    expect(normalizeMenuRoute("/customers/all")).toBe("/customers/all");
    expect(normalizeMenuRoute("  /network/mikrotik  ")).toBe("/network/mikrotik");
  });
});

describe("permission map + menu tree normalization", () => {
  const menus: ApiMenuItem[] = [
    menuItem({ idxno: 1, label: "Packages", route: "/finance/packages", icon: "package", sortOrder: 1 }),
    menuItem({
      idxno: 2,
      label: "Subs",
      route: "/customers",
      icon: "group",
      sortOrder: 2,
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      children: [
        menuItem({ idxno: 3, label: "Directory", route: "/customers/active", icon: "person_search", sortOrder: 1 }),
      ],
    }),
  ];

  it("extractPermissions keys are normalized routes", () => {
    const map = extractPermissions(menus);
    expect(map).toHaveProperty("/system/packages");
    expect(map).toHaveProperty("/customers");
    expect(map).toHaveProperty("/customers/all");
    expect(map).not.toHaveProperty("/finance/packages");
    expect(map).not.toHaveProperty("/customers/active");
    expect(map["/system/packages"].canView).toBe(true);
    expect(map["/customers/all"].canView).toBe(true);
  });

  it("apiMenusToMenuTree uses normalized routes as node ids", () => {
    const tree = apiMenusToMenuTree(menus);
    expect(tree[0].route).toBe("/system/packages");
    expect(tree[0].idxno).toBe(1);
    expect(tree[1].children?.[0].route).toBe("/customers/all");
  });

  it("apiMenusToNavGroups renders normalized hrefs", () => {
    const groups = apiMenusToNavGroups(menus);
    const flat = groups.flatMap((g) => g.items);
    expect(flat.find((i) => i.label === "Packages")?.href).toBe("/system/packages");
    expect(flat.find((i) => i.label === "Subs")?.children?.[0].href).toBe("/customers/all");
  });

  it("apiMenusToNavGroups prunes canView=false items and children", () => {
    const groups = apiMenusToNavGroups([
      menuItem({ idxno: 1, label: "Hidden", route: "/hidden", canView: false }),
      menuItem({
        idxno: 2,
        label: "Visible",
        route: "/visible",
        canView: true,
        children: [
          menuItem({ idxno: 3, label: "HiddenChild", route: "/hidden-child", canView: false }),
          menuItem({ idxno: 4, label: "VisibleChild", route: "/visible-child", canView: true }),
        ],
      }),
    ]);

    const flat = groups.flatMap((g) => g.items);
    expect(flat.map((i) => i.label)).toEqual(["Visible"]);
    expect(flat[0].children?.map((c) => c.label)).toEqual(["VisibleChild"]);
  });

  it("getStaticNavForRole returns investor nav for 04/ROLE_INVESTOR", () => {
    const groups = getStaticNavForRole("04");
    expect(groups.flatMap((g) => g.items).map((i) => i.href)).toContain("/finance/investor");
  });

  it("staff nav no longer exposes admin-only router/onboarding surfaces (Trap 3)", () => {
    const groups = getStaticNavForRole("03");
    const hrefs = groups.flatMap((g) => g.items).map((i) => i.href);
    expect(hrefs).not.toContain("/network/routers");
    expect(hrefs).not.toContain("/network/routers/onboard");
    expect(hrefs).not.toContain("/network/routers/setup");
    expect(hrefs).not.toContain("/network/ip-pools");
    expect(hrefs).not.toContain("/network/ip-mappings");
    // Read-only monitoring surfaces remain for staff.
    expect(hrefs).toContain("/network/live-sessions");
    expect(hrefs).toContain("/network/mikrotik");
  });
});

describe("getPermissionForRoute alias tolerance", () => {
  it("resolves a stale alias to the canonical route's permission flags", async () => {
    server.use(
      http.get(`${API_PREFIX}/system-setup/:roleCode/menus`, () =>
        HttpResponse.json(
          {
            status: 200,
            success: true,
            message: "OK",
            data: [
              {
                idxno: 10,
                label: "MikroTik",
                route: "/network/microtick",
                icon: "router",
                sortOrder: 1,
                canView: true,
                canCreate: false,
                canEdit: false,
                canDelete: false,
                children: [],
              },
            ],
            timestamp: "2026-09-03T00:00:00.000Z",
          },
          { status: 200 }
        )
      )
    );

    // Query with the canonical route — should match the normalized alias key.
    const perms = await getPermissionForRoute("/network/mikrotik");
    expect(perms.canView).toBe(true);
    expect(perms.canCreate).toBe(false);

    // Query with the stale alias — same normalized key, same flags.
    const permsViaAlias = await getPermissionForRoute("/network/microtick");
    expect(permsViaAlias.canView).toBe(true);
  });

  it("returns NO_PERMISSIONS for a route absent from both API and static nav", async () => {
    server.use(
      http.get(`${API_PREFIX}/system-setup/:roleCode/menus`, () =>
        HttpResponse.json(
          { status: 200, success: true, message: "OK", data: [], timestamp: "2026-09-03T00:00:00.000Z" },
          { status: 200 }
        )
      )
    );
    const perms = await getPermissionForRoute("/network/wholly-unknown");
    expect(perms.canView).toBe(false);
    expect(perms.canCreate).toBe(false);
    expect(perms.canEdit).toBe(false);
    expect(perms.canDelete).toBe(false);
  });
});

describe("fail-closed runtime getters", () => {
  it("getCurrentUserPermissions returns {} (not static all-true) when the API is empty", async () => {
    server.use(
      http.get(`${API_PREFIX}/system-setup/:roleCode/menus`, () =>
        HttpResponse.json(
          { status: 200, success: true, message: "OK", data: [], timestamp: "2026-09-03T00:00:00.000Z" },
          { status: 200 }
        )
      )
    );

    await expect(getCurrentUserPermissions()).resolves.toEqual({});
  });

  it("getPermissionForRoute denies a known route when the API is empty (no static fallback)", async () => {
    server.use(
      http.get(`${API_PREFIX}/system-setup/:roleCode/menus`, () =>
        HttpResponse.json(
          { status: 200, success: true, message: "OK", data: [], timestamp: "2026-09-03T00:00:00.000Z" },
          { status: 200 }
        )
      )
    );

    // /customers is in the static staff nav, but the static fallback is gone.
    const perms = await getPermissionForRoute("/customers");
    expect(perms.canView).toBe(false);
  });
});

describe("sidebar = static layout filtered by API permissions", () => {
  const view = { canView: true, canCreate: false, canEdit: false, canDelete: false };
  const hidden = { canView: false, canCreate: false, canEdit: false, canDelete: false };

  it("staff roles share the admin layout; investor/customer keep theirs; unknown gets none", () => {
    expect(getNavLayoutForRole("SYSADMIN")).toBe(getNavLayoutForRole("03"));
    expect(getNavLayoutForRole("02")).toBe(getNavLayoutForRole("01"));
    expect(getNavLayoutForRole("04")).toBe(getStaticNavForRole("04"));
    expect(getNavLayoutForRole("05")).toBe(getStaticNavForRole("05"));
    expect(getNavLayoutForRole("WHATEVER")).toEqual([]);
  });

  it("an empty permission map renders an empty sidebar (fail closed)", () => {
    expect(filterNavByPermissions(getNavLayoutForRole("01"), {})).toEqual([]);
  });

  it("keeps the static groups, labels and order for the routes the role may view", () => {
    const nav = filterNavByPermissions(getNavLayoutForRole("03"), {
      "/finance/expenses": view,
      "/finance/statements": view,
      "/network/regions": view,
      "/system/users": hidden,
    });
    expect(nav.map((g) => g.label)).toEqual(["Network", "Finance"]);
    expect(nav[1].items.map((i) => i.label)).toEqual(["Expenses", "Statements"]);
    expect(nav[1].items[0].canCreate).toBe(false);
  });

  it("a parent stays for a viewable child and loses the children the role cannot view", () => {
    const nav = filterNavByPermissions(getNavLayoutForRole("01"), {
      "/finance/billing/payments": view,
      "/finance/billing/invoices": hidden,
    });
    const billing = nav.flatMap((g) => g.items).find((i) => i.href === "/finance/billing");
    expect(billing?.children?.map((c) => c.label)).toEqual(["Payments"]);
  });
});
