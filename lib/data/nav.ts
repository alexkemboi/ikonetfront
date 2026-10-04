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
import { ROLE_NAME, normalizeRole } from "@/lib/types/roles";
import type { NavGroup, NavItem, MenuNode } from "@/lib/nav";
import { auth } from "@/lib/auth";
import { buildApiUrl } from "@/lib/constants";
import { adminNavGroups }      from "@/config/nav-admin";
import { managementNavGroups } from "@/config/nav-management";
import { staffNavGroups }      from "@/config/nav-staff";
import { customerNavGroups }   from "@/config/nav-customer";
import { investorNavGroups }   from "@/config/nav-investor";
import { NO_PERMISSIONS } from "@/lib/data/nav-constants";

export { NO_PERMISSIONS } from "@/lib/data/nav-constants";

export const NAV_MENUS_TAG = "nav-menus";

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
 * Sends the **raw session role** (e.g. "03", "FINANCE_MANAGER", "ROLE_03");
 * the backend resolves codes/aliases. Never derives the URL from a normalized
 * name, so an unknown role cannot silently fall back to another role's menus.
 *
 * @param role  - raw session role from session.user.role
 * @param apiToken  - Bearer token from session.user.apiToken
 */
export async function fetchRoleMenusRaw(
  role: string,
  apiToken: string
): Promise<ApiMenuItem[]> {
  const roleLabel = role?.trim() ?? "";
  if (!roleLabel || !apiToken) return [];

  try {
    const res = await fetch(
      buildApiUrl(`/system-setup/${encodeURIComponent(roleLabel)}/menus`),
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiToken}`,
        },
        // Cache with a tag so revalidateTag(NAV_MENUS_TAG) invalidates this data
        next: { tags: [NAV_MENUS_TAG, `${NAV_MENUS_TAG}-${roleLabel}`] },
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
 * Fail closed: only items the catalog marks `canView` are rendered, and
 * non-viewable children are pruned. All menus are shown in a single unlabelled
 * group, sorted by sortOrder. The Sidebar's ICON_MAP maps the Material icon
 * names to Lucide components.
 */
export function apiMenusToNavGroups(menus: ApiMenuItem[]): NavGroup[] {
  if (!menus.length) return [];

  const toNavItem = (menu: ApiMenuItem): NavItem => {
    const children = (menu.children ?? []).filter((child) => child.canView);
    return {
      href:      normalizeMenuRoute(menu.route),
      label:     menu.label,
      icon:      menu.icon,
      canView:   menu.canView,
      canEdit:   menu.canEdit,
      canDelete: menu.canDelete,
      canCreate: menu.canCreate,
      children:  children.length
        ? children
            .slice()
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map(toNavItem)
        : undefined,
    };
  };

  const items: NavItem[] = menus
    .filter((menu) => menu.canView)
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(toNavItem);

  return items.length ? [{ items }] : [];
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
 * The sidebar layout (groups, labels, order, icons) for a role.
 *
 * Layout lives in the static config; WHO sees each entry is decided by the
 * API permission map (see {@link filterNavByPermissions}). Staff roles share
 * one master layout (the admin one, a superset) so a permission granted in the
 * catalog shows up without a per-role layout edit. Investor and customer keep
 * their own portal layouts. Unknown role ⇒ no layout (fail closed).
 */
export function getNavLayoutForRole(role: string): NavGroup[] {
  switch (normalizeRole(role)) {
    case ROLE_NAME.ADMIN:
    case ROLE_NAME.MANAGEMENT:
    case ROLE_NAME.STAFF:      return adminNavGroups;
    case ROLE_NAME.INVESTOR:   return investorNavGroups;
    case ROLE_NAME.CUSTOMER:   return customerNavGroups;
    default:                   return [];
  }
}

/**
 * Keep only the layout entries the permission map lets the caller view, and
 * stamp each kept entry with its real flags.
 *
 * Fail closed: a route absent from the map is hidden. A parent stays when its
 * own route is viewable or at least one child is; empty groups are dropped.
 */
export function filterNavByPermissions(
  groups: NavGroup[],
  permissions: PermissionMap
): NavGroup[] {
  const flagsFor = (href: string) => permissions[normalizeMenuRoute(href)];

  const result: NavGroup[] = [];
  for (const group of groups) {
    const items: NavItem[] = [];
    for (const item of group.items) {
      const own = flagsFor(item.href);
      const children = (item.children ?? [])
        .filter((child) => flagsFor(child.href)?.canView)
        .map((child) => ({ ...child, ...flagsFor(child.href) }));
      if (!own?.canView && children.length === 0) continue;
      items.push({
        ...item,
        ...(own ?? {}),
        children: children.length ? children : undefined,
      });
    }
    if (items.length) result.push({ ...group, items });
  }
  return result;
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
 * Fail closed: unknown role, missing token, an empty menu list, or a fetch
 * error all yield an empty map (no static-nav fallback, never all-true).
 *
 * Usage in a server page:
 *   const permissions = await getCurrentUserPermissions();
 *   const pagePerms   = permissions["/system/roles"] ?? NO_PERMISSIONS;
 */
export async function getCurrentUserPermissions(): Promise<PermissionMap> {
  const session = await auth();
  if (!session?.user?.role || !session?.user?.apiToken) return {};
  const menus = await fetchRoleMenusRaw(session.user.role, session.user.apiToken);
  return menus.length > 0 ? extractPermissions(menus) : {};
}

/**
 * Resolve a single route's permission flags for the current user.
 *
 * Fail closed: a route absent from the API-driven menu is denied
 * (`NO_PERMISSIONS`). There is no per-route static-nav fallback, so a stale
 * alias or an unseeded route cannot grant access.
 */
export async function getPermissionForRoute(
  route: string
): Promise<PermissionFlags> {
  const normalizedRoute = normalizeMenuRoute(route);
  const session = await auth();
  if (!session?.user?.role || !session?.user?.apiToken) return NO_PERMISSIONS;
  const menus = await fetchRoleMenusRaw(session.user.role, session.user.apiToken);
  const map = extractPermissions(menus);
  return map[normalizedRoute] ?? NO_PERMISSIONS;
}
