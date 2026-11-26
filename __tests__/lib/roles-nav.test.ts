import { describe, it, expect, vi, beforeEach } from "vitest";
import { server } from "@/mocks/server";
import { http, HttpResponse } from "msw";
import { API_PREFIX } from "@/mocks/handlers/auth-guard";
import { type ApiMenuItem } from "@/lib/types/roles";
import { can, holdsRight, hasPlatformScope, isCustomerAccess, isInvestorAccess, NO_ACCESS, type NavAccess } from "@/lib/access";
import { getLandingRoute } from "@/lib/data/access";
import {
  normalizeMenuRoute,
  extractPermissions,
  apiMenusToMenuTree,
  apiMenusToNavGroups,
  getPermissionForRoute,
  getCurrentUserPermissions,
  navigationToNavGroups,
  fetchNavigation,
} from "@/lib/data/nav";
import type { NavigationPayload } from "@/lib/nav";
import { auth } from "@/lib/auth";
import { apiFetch } from "@/lib/apiClient";

// fetchNavigation goes through apiFetch; the other helpers here call fetch directly.
vi.mock("@/lib/apiClient", () => ({ apiFetch: vi.fn() }));
const mockedApiFetch = vi.mocked(apiFetch);

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

describe("access from the database (lib/access.ts)", () => {
  const custom: NavAccess = { superAdmin: false, roleCode: "NETWORK_ADMIN", principalType: "STAFF",
    scopeLevel: "COMPANY", permissions: { API_NETWORKDEVICE: ["VIEW", "EDIT"], SYSTEM_FEE_PAY: ["VIEW"] } };

  it("a role may do exactly what it is granted", () => {
    expect(can(custom, "API_NETWORKDEVICE", "EDIT")).toBe(true);
    expect(can(custom, "API_NETWORKDEVICE", "DELETE")).toBe(false);   // view/edit never imply delete
    expect(can(custom, "API_EXPENSE")).toBe(false);
    expect(holdsRight(custom, "SYSTEM_FEE_PAY")).toBe(true);
  });

  it("the super admin holds every permission", () => {
    expect(can({ superAdmin: true, permissions: {} }, "API_ANYTHING", "DELETE")).toBe(true);
  });

  it("no access, or a failed API, grants nothing (fail closed)", () => {
    expect(can(NO_ACCESS, "API_NETWORKDEVICE")).toBe(false);
    expect(can(undefined, "API_NETWORKDEVICE")).toBe(false);
  });

  it("role type and scope come from the role, not its name", () => {
    expect(isInvestorAccess({ ...NO_ACCESS, principalType: "INVESTOR" })).toBe(true);
    expect(isCustomerAccess({ ...NO_ACCESS, principalType: "CUSTOMER" })).toBe(true);
    expect(hasPlatformScope(custom)).toBe(false);
    expect(hasPlatformScope({ ...custom, scopeLevel: "PLATFORM" })).toBe(true);
    expect(hasPlatformScope({ superAdmin: true, permissions: {} })).toBe(true);
  });
});

describe("landing route dispatch (roles.landing_route)", () => {
  const nav = (access: Partial<NavAccess> | null, groups: NavigationPayload["groups"] = []) => ({
    status: 200, success: true, message: "ok",
    data: { user: { username: "u", displayName: "U", role: "X" }, company: null, platform: null, portal: "STAFF",
      groups, access: access ? { superAdmin: false, permissions: {}, ...access } : undefined },
  });
  const firstGroup = [{ key: "g", label: "G", displayOrder: 1, items: [{ key: "i", label: "Customers", route: "/customers", displayOrder: 1 }] }];

  it("uses the role's landing page", async () => {
    mockedApiFetch.mockResolvedValueOnce(nav({ roleCode: "02", landingRoute: "/analytics" }, firstGroup) as never);
    expect(await getLandingRoute()).toBe("/analytics");
  });

  it("falls back to the first sidebar entry for a role without one", async () => {
    mockedApiFetch.mockResolvedValueOnce(nav({ roleCode: "NETWORK_ADMIN", landingRoute: null }, firstGroup) as never);
    expect(await getLandingRoute()).toBe("/customers");
  });

  it("an unknown role or a failed API goes to the unguarded no-access page (no redirect loop)", async () => {
    mockedApiFetch.mockResolvedValueOnce(nav(null) as never);
    expect(await getLandingRoute()).toBe("/no-access");
    mockedApiFetch.mockResolvedValueOnce({ status: 500, success: false, message: "x", data: null } as never);
    expect(await getLandingRoute()).toBe("/no-access");
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
    // Finance › Payments is its own page now, not an alias of Billing › Payments
    expect(normalizeMenuRoute("/finance/payments")).toBe("/finance/payments");
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

  it("a route-less permission entry the role lacks does not hide the dashboard", () => {
    const withSwitch: ApiMenuItem[] = [
      menuItem({
        idxno: 10,
        label: "Dashboard",
        route: "/dashboard",
        children: [menuItem({ idxno: 11, label: "Admin Dashboard", route: "/dashboard/overview" })],
      }),
      menuItem({ idxno: 64, label: "Finance data", route: null as unknown as string, canView: false }),
    ];
    expect(extractPermissions(withSwitch)["/dashboard/overview"].canView).toBe(true);
    const labels = apiMenusToNavGroups(withSwitch.map((m) => ({ ...m, canView: true })))
      .flatMap((g) => g.items)
      .map((i) => i.label);
    expect(labels).not.toContain("Finance data");
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

describe("sidebar = database navigation (GET /navigation/me)", () => {
  const groups: NavigationPayload["groups"] = [
    {
      key: "staff.finance",
      label: "Finance",
      displayOrder: 60,
      items: [
        { key: "staff.finance.statements", label: "Statements", route: "/finance/statements", icon: "file-text", displayOrder: 40, canView: true, canCreate: false, canEdit: false, canDelete: false },
        { key: "staff.finance.expenses", label: "Expenses", route: "/finance/expenses", icon: "receipt", displayOrder: 30, canView: true, canCreate: true, canEdit: false, canDelete: false },
      ],
    },
    {
      key: "staff.overview",
      label: "Overview",
      displayOrder: 10,
      items: [
        { key: "staff.overview.overview", label: "Overview", route: "/dashboard/overview", icon: "layout-dashboard", exact: true, canView: true },
      ],
    },
    {
      key: "staff.billing",
      label: "Billing",
      displayOrder: 70,
      items: [
        {
          key: "staff.billing.billing", label: "Billing", route: "/finance/billing", icon: "credit-card", canView: null,
          children: [
            { key: "staff.billing.invoices", label: "Invoices", route: "/finance/billing/invoices", icon: "file-text", displayOrder: 20, canView: true },
            { key: "staff.billing.payments", label: "Payments", route: "/finance/billing/payments", icon: "credit-card", displayOrder: 10, canView: true },
          ],
        },
      ],
    },
    { key: "staff.empty", label: "Empty", displayOrder: 5, items: [] },
  ];

  it("orders sections and entries by display order and drops empty sections", () => {
    const nav = navigationToNavGroups(groups);
    expect(nav.map((g) => g.label)).toEqual(["Overview", "Finance", "Billing"]);
    expect(nav[1].items.map((i) => i.label)).toEqual(["Expenses", "Statements"]);
    expect(nav[2].items[0].children?.map((c) => c.label)).toEqual(["Payments", "Invoices"]);
  });

  it("normalizes routes and keeps the permission flags and exact matching", () => {
    const nav = navigationToNavGroups(groups);
    expect(nav[0].items[0]).toMatchObject({ href: "/dashboard/overview", exact: true, canView: true });
    expect(nav[1].items[0]).toMatchObject({ href: "/finance/expenses", canCreate: true, canEdit: false });
    expect(nav[1].items[1].href).toBe("/finance/statements");
  });

  it("a null flag (no catalogue entry) becomes undefined, which the sidebar renders", () => {
    const billing = navigationToNavGroups(groups)[2].items[0];
    expect(billing.canView).toBeUndefined();
  });

  it("no groups from the API means an empty sidebar (fail closed)", () => {
    expect(navigationToNavGroups([])).toEqual([]);
  });

  it("fetchNavigation returns the payload on success", async () => {
    const payload: NavigationPayload = {
      user: { username: "jane", displayName: "Jane Doe", role: "01", roleName: "ADMIN" },
      company: { code: "CMP-ACM-001", name: "Acme Net", logoUrl: "https://cdn.example/acme.svg" },
      platform: null,
      portal: "STAFF",
      groups,
    };
    mockedApiFetch.mockResolvedValueOnce({ status: 200, success: true, message: "ok", data: payload } as never);
    const result = await fetchNavigation();
    expect(mockedApiFetch).toHaveBeenCalledWith("/navigation/me", { cache: "no-store" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.company?.name).toBe("Acme Net");
      expect(result.data.user.displayName).toBe("Jane Doe");
    }
  });

  it("fetchNavigation reports an error instead of falling back to a hardcoded menu", async () => {
    mockedApiFetch.mockResolvedValueOnce({ status: 500, success: false, message: "boom", data: null } as never);
    const result = await fetchNavigation();
    expect(result.ok).toBe(false);
  });
});
