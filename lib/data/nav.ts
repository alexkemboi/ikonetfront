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
import { ROLE_CODE, ROLE_NAME, roleNameToCode } from "@/lib/types/roles";
import type { NavGroup, NavItem, MenuNode } from "@/lib/nav";
import { auth } from "@/lib/auth";
import { adminNavGroups }      from "@/config/nav-admin";
import { managementNavGroups } from "@/config/nav-management";
import { staffNavGroups }      from "@/config/nav-staff";
import { customerNavGroups }   from "@/config/nav-customer";

// Old role-specific dashboard routes that no longer exist — normalize to /dashboard
const OLD_DASHBOARD_ROUTES = new Set([
  "/dashboard/admin",
  "/dashboard/management",
  "/dashboard/staff",
  "/dashboard/customer",
]);

export const NAV_MENUS_TAG = "nav-menus";

// All-false default used when a route is missing from the map
export const NO_PERMISSIONS: PermissionFlags = {
  canView: false, canCreate: false, canEdit: false, canDelete: false,
};

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
      `${process.env.BASE_API_URL}system-setup/${roleCode}/menus`,
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
      href:      OLD_DASHBOARD_ROUTES.has(menu.route) ? "/dashboard" : menu.route,
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
              href:      OLD_DASHBOARD_ROUTES.has(child.route) ? "/dashboard" : child.route,
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
  switch (role) {
    case ROLE_NAME.ADMIN:
    case ROLE_CODE[ROLE_NAME.ADMIN]:      return adminNavGroups;
    case ROLE_NAME.MANAGEMENT:
    case ROLE_CODE[ROLE_NAME.MANAGEMENT]: return managementNavGroups;
    case ROLE_NAME.STAFF:
    case ROLE_CODE[ROLE_NAME.STAFF]:      return staffNavGroups;
    case ROLE_NAME.CUSTOMER:
    case ROLE_CODE[ROLE_NAME.CUSTOMER]:   return customerNavGroups;
    default:                              return staffNavGroups;
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
    .map((menu) => ({
      idxno:      parseInt(menu.idxno.toString()) || 0,
      id:         menu.route,
      menuItemId: menu.idxno,
      route:      menu.route,
      label:      menu.label,
      icon:       menu.icon,
      children: menu.children?.length
        ? menu.children
            .slice()
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((child) => ({
              idxno:      parseInt(child.idxno.toString()),
              id:         child.route,
              menuItemId: child.idxno,
              route:      child.route,
              label:      child.label,
              icon:       child.icon,
            }))
        : undefined,
    }));
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
    map[menu.route] = {
      canView:   menu.canView,
      canCreate: menu.canCreate,
      canEdit:   menu.canEdit,
      canDelete: menu.canDelete,
    };
    for (const child of menu.children) {
      map[child.route] = {
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
 * Fetch the current logged-in user's permissions as a PermissionMap.
 *
 * Call this in any server component/page that needs to guard UI actions.
 * Returns an empty map if the session is missing — treat as no access.
 *
 * Usage in a server page:
 *   const permissions = await getCurrentUserPermissions();
 *   const pagePerms   = permissions["/system/roles"] ?? NO_PERMISSIONS;
 */
export async function getCurrentUserPermissions(): Promise<PermissionMap> {
  const session = await auth();
  if (!session?.user?.role || !session?.user?.apiToken) return {};
  const menus = await fetchRoleMenusRaw(session.user.role, session.user.apiToken);
  return extractPermissions(menus);
}
