/**
 * Server-side nav data fetching.
 *
 * Uses native fetch with `next: { tags }` so Next.js can cache and selectively
 * revalidate with `revalidateTag(NAV_MENUS_TAG)` — e.g., after saving permissions.
 *
 * NOT a server action ("use server") — just a plain async function called from
 * server components (layouts, pages). Server actions are for mutations only.
 */

import type { ApiMenuItem, PermissionFlags, PermissionMap } from "@/lib/types/roles";
import { ROLE_NAME, roleNameToCode, normalizeRole } from "@/lib/types/roles";
import type { NavGroup, NavItem, MenuNode } from "@/lib/nav";
import { auth } from "@/lib/auth";
import { buildApiUrl } from "@/lib/constants";
import { adminNavGroups }      from "@/config/nav-admin";
import { managementNavGroups } from "@/config/nav-management";
import { staffNavGroups }      from "@/config/nav-staff";
import { customerNavGroups }   from "@/config/nav-customer";
import { investorNavGroups }   from "@/config/nav-investor";

export const NAV_MENUS_TAG = "nav-menus";

// All-false default used when a route is missing from the map
export const NO_PERMISSIONS: PermissionFlags = {
  canView: false, canCreate: false, canEdit: false, canDelete: false,
};

export function normalizeMenuRoute(route: string): string {
  const clean = route?.trim();
  if (!clean) return "/dashboard/overview";

  const routeMap: Record<string, string> = {
    "/finance/packages": "/system/packages",
    "/packages": "/system/packages",
    "/system/internet-packages": "/system/packages",
    "/dashboard/admin": "/dashboard/overview",
    "/dashboard/management": "/analytics",
    "/dashboard/staff": "/customers",
    "/dashboard/customer": "/portal/pppoe",
    "/customers/active": "/customers/all",
    "/customers/directory": "/customers/all",
    "/customers/ip-bindings": "/customers/bindings",
    "/network/ip-mapping": "/customers/bindings",
    "/customers/pppoe": "/portal/pppoe",
    "/network/microtick": "/network/mikrotik",
    "/network-routers": "/network/routers",
    "/routers": "/network/routers",
    "/finance/coa": "/finance/ledger",
    "/finance/chart-of-accounts": "/finance/ledger",
    "/finance/payments": "/finance/billing/payments",
    "/finance/invoices": "/finance/billing/invoices",
    "/investor/dashboard": "/finance/investor",
  };

  return routeMap[clean] ?? clean;
}

/**
 * Fetch the menu/permission tree for a given role.
 * Returns the raw `ApiMenuItem[]` so callers can shape it as needed.
 *
 * Accepts either a role name (e.g. "ADMIN") or a code (e.g. "01").
 * The backend URL requires the code, so the value is normalized via
 * `roleNameToCode` before being placed in the path.
 *
 * @param role  - role name (preferred) or code — from session.user.role
 * @param apiToken  - Bearer token from session.user.apiToken
 */
export async function fetchRoleMenusRaw(
  role: string,
  apiToken: string
): Promise<ApiMenuItem[]> {
  if (!role || !apiToken) return [];

  // If the caller already passed a code, keep it; otherwise convert name → code.
  const looksLikeCode = /^\d{1,3}$/.test(role);
  const roleCode = looksLikeCode ? role : roleNameToCode(role);

  try {
    const res = await fetch(
      buildApiUrl(`/system-setup/${roleCode}/menus`),
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiToken}`,
        },
        // Cache with a tag so revalidateTag(NAV_MENUS_TAG) invalidates this data
        next: { tags: [NAV_MENUS_TAG, `${NAV_MENUS_TAG}-${roleCode}`] },
      }
    );

    const data = await res.json();
    return data.success && Array.isArray(data.data) ? data.data : [];
  } catch {
    return [];
  }
}

// ── Converters ─────────────────────────────────────────────────────────

/**
 * Convert API menu items → NavGroup[] for the Sidebar.
 *
 * All menus are shown in a single unlabelled group, sorted by sortOrder.
 * The Sidebar's ICON_MAP maps the Material icon names to Lucide components.
 */
export function apiMenusToNavGroups(menus: ApiMenuItem[]): NavGroup[] {
  if (!menus.length) return [];

  const items: NavItem[] = menus
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((menu) => ({
      href:      normalizeMenuRoute(menu.route),
      label:     menu.label,
      icon:      menu.icon,
      canView:   menu.canView,
      canEdit:   menu.canEdit,
      canDelete: menu.canDelete,
      canCreate: menu.canCreate,
      children:  menu.children?.length
        ? menu.children
            .slice()
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((child) => ({
              href:      normalizeMenuRoute(child.route),
              label:     child.label,
              icon:      child.icon,
              canView:   child.canView,
              canEdit:   child.canEdit,
              canDelete: child.canDelete,
              canCreate: child.canCreate,
            }))
        : undefined,
    }));

  return [{ items }];
}

/**
 * Returns the static nav config for a role.
 * Used as a fallback when the API returns no menus (e.g. permissions not yet configured).
 *
 * Accepts either a role name (preferred) or a code.
 */
export function getStaticNavForRole(role: string): NavGroup[] {
  switch (normalizeRole(role)) {
    case ROLE_NAME.ADMIN:      return adminNavGroups;
    case ROLE_NAME.MANAGEMENT: return managementNavGroups;
    case ROLE_NAME.STAFF:      return staffNavGroups;
    case ROLE_NAME.INVESTOR:   return investorNavGroups;
    case ROLE_NAME.CUSTOMER:   return customerNavGroups;
    default:                   return staffNavGroups;
  }
}

/**
 * Convert API menu items → MenuNode[] for the Roles page permission tree.
 *
 * Uses `route` as the node `id` (unique, stable key for permission tracking).
 * Carries `menuItemId` so the Save action can reference the correct DB row.
 */
export function apiMenusToMenuTree(menus: ApiMenuItem[]): MenuNode[] {
  return menus
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((menu) => {
      const route = normalizeMenuRoute(menu.route);
      return ({
      idxno:      parseInt(menu.idxno.toString()) || 0,
      id:         route,
      menuItemId: menu.idxno,
      route,
      label:      menu.label,
      icon:       menu.icon,
      children: menu.children?.length
        ? menu.children
            .slice()
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((child) => {
              const childRoute = normalizeMenuRoute(child.route);
              return ({
              idxno:      parseInt(child.idxno.toString()),
              id:         childRoute,
              menuItemId: child.idxno,
              route:      childRoute,
              label:      child.label,
              icon:       child.icon,
            });
            })
        : undefined,
    });
    });
}

/**
 * Flatten an ApiMenuItem[] into a PermissionMap (route → flags).
 *
 * Previously this returned string[] of only canView=true routes.
 * Now we preserve all four flags so the UI and save logic can use real values.
 */
export function extractPermissions(menus: ApiMenuItem[]): PermissionMap {
  const map: PermissionMap = {};
  for (const menu of menus) {
    map[normalizeMenuRoute(menu.route)] = {
      canView:   menu.canView,
      canCreate: menu.canCreate,
      canEdit:   menu.canEdit,
      canDelete: menu.canDelete,
    };
    for (const child of menu.children ?? []) {
      map[normalizeMenuRoute(child.route)] = {
        canView:   child.canView,
        canCreate: child.canCreate,
        canEdit:   child.canEdit,
        canDelete: child.canDelete,
      };
    }
  }
  return map;
}

/**
 * Build a permission map from static nav groups (all flags true for routes
 * that the static config exposes). Used as a fallback when the API-driven
 * menu returns nothing (e.g. roles table empty, or backend misconfigured).
 */
export function staticNavToPermissions(groups: NavGroup[]): PermissionMap {
  const map: PermissionMap = {};
  const visit = (items: NavGroup["items"]) => {
    for (const item of items) {
      if (item.href) {
        map[normalizeMenuRoute(item.href)] = {
          canView: true, canCreate: true, canEdit: true, canDelete: true,
        };
      }
      if (item.children) visit(item.children);
    }
  };
  for (const g of groups) visit(g.items);
  return map;
}

/**
 * Fetch the current logged-in user's permissions as a PermissionMap.
 *
 * Call this in any server component/page that needs to guard UI actions.
 * Falls back to static nav permissions when the API returns no menus —
 * matching the layout's own fallback so pages aren't needlessly blocked.
 *
 * Usage in a server page:
 *   const permissions = await getCurrentUserPermissions();
 *   const pagePerms   = permissions["/system/roles"] ?? NO_PERMISSIONS;
 */
export async function getCurrentUserPermissions(): Promise<PermissionMap> {
  const session = await auth();
  if (!session?.user?.role || !session?.user?.apiToken) return {};
  const menus = await fetchRoleMenusRaw(session.user.role, session.user.apiToken);
  if (menus.length > 0) return extractPermissions(menus);
  // Fallback: derive permissions from static nav config
  return staticNavToPermissions(getStaticNavForRole(session.user.role));
}

/**
 * Resolve a single route's permission flags for the current user.
 *
 * Unlike `getCurrentUserPermissions`, a route that is missing from the
 * API-driven menu (e.g. a brand-new frontend route the backend menu tree
 * doesn't know yet) falls back to the static nav config instead of being
 * treated as fully denied. This keeps new pages reachable during a
 * frontend-only deploy until the backend menu tree is seeded in tandem;
 * once the backend serves the route with explicit flags, those win.
 */
export async function getPermissionForRoute(
  route: string
): Promise<PermissionFlags> {
  const normalizedRoute = normalizeMenuRoute(route);
  const session = await auth();
  if (!session?.user?.role || !session?.user?.apiToken) return NO_PERMISSIONS;
  const menus = await fetchRoleMenusRaw(session.user.role, session.user.apiToken);
  if (menus.length > 0) {
    const map = extractPermissions(menus);
    return map[normalizedRoute] ?? staticNavToPermissions(getStaticNavForRole(session.user.role))[normalizedRoute] ?? NO_PERMISSIONS;
  }
  return staticNavToPermissions(getStaticNavForRole(session.user.role))[normalizedRoute] ?? NO_PERMISSIONS;
}
