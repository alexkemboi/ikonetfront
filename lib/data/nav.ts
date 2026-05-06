/**
 * Server-side nav data fetching.
 *
 * Uses native fetch with `next: { tags }` so Next.js can cache and selectively
 * revalidate with `revalidateTag(NAV_MENUS_TAG)` — e.g., after saving permissions.
 *
 * NOT a server action ("use server") — just a plain async function called from
 * server components (layouts, pages). Server actions are for mutations only.
 */

import type { ApiMenuItem } from "@/lib/types/roles";
import type { NavGroup, NavItem, MenuNode } from "@/lib/nav";
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

/**
 * Fetch the menu/permission tree for a given role code.
 * Returns the raw `ApiMenuItem[]` so callers can shape it as needed.
 *
 * @param roleCode  - e.g. "01", "02" — from session.user.role
 * @param apiToken  - Bearer token from session.user.apiToken
 */
export async function fetchRoleMenusRaw(
  roleCode: string,
  apiToken: string
): Promise<ApiMenuItem[]> {
  if (!roleCode || !apiToken) return [];

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
      href:  OLD_DASHBOARD_ROUTES.has(menu.route) ? "/dashboard" : menu.route,
      label: menu.label,
      icon:  menu.icon,
      children: menu.children?.length
        ? menu.children
            .slice()
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((child) => ({
              href:  OLD_DASHBOARD_ROUTES.has(child.route) ? "/dashboard" : child.route,
              label: child.label,
              icon:  child.icon,
            }))
        : undefined,
    }));

  return [{ items }];
}

/**
 * Returns the static nav config for a role.
 * Used as a fallback when the API returns no menus (e.g. permissions not yet configured).
 */
export function getStaticNavForRole(roleCode: string): NavGroup[] {
  switch (roleCode) {
    case "01": return adminNavGroups;
    case "02": return managementNavGroups;
    case "03": return staffNavGroups;
    case "04": return customerNavGroups;
    default:   return staffNavGroups;
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
      id:         menu.route,
      menuItemId: menu.menuItemId,
      label:      menu.label,
      icon:       menu.icon,
      children: menu.children?.length
        ? menu.children
            .slice()
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((child) => ({
              id:         child.route,
              menuItemId: child.menuItemId,
              label:      child.label,
              icon:       child.icon,
            }))
        : undefined,
    }));
}

/**
 * Flatten an ApiMenuItem[] into the set of route IDs this role can VIEW.
 * Used to populate `Role.permissions` on the Roles page.
 *
 * If canView is universally false (new system, no permissions assigned),
 * all routes are included so the tree is fully visible but not "checked".
 */
export function extractPermissions(menus: ApiMenuItem[]): string[] {
  const perms: string[] = [];
  for (const menu of menus) {
    if (menu.canView) perms.push(menu.route);
    for (const child of menu.children) {
      if (child.canView) perms.push(child.route);
    }
  }
  return perms;
}
