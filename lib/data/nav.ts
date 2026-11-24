/**
 * Server-side nav data fetching.
 *
 * Permissions and the sidebar are read fresh on every page load (React `cache()` shares one
 * call within a render), so role and permission changes apply to the next page load.
 *
 * NOT a server action ("use server") — just a plain async function called from
 * server components (layouts, pages). Server actions are for mutations only.
 */

import { cache } from "react";
import type { ApiMenuItem, PermissionFlags, PermissionMap } from "@/lib/types/roles";
import type { NavGroup, NavItem, MenuNode, ApiNavItem, NavigationPayload } from "@/lib/nav";
import { auth } from "@/lib/auth";
import { apiFetch } from "@/lib/apiClient";
import { buildApiUrl } from "@/lib/constants";
import { NO_PERMISSIONS, normalizeMenuRoute } from "@/lib/data/nav-constants";

export { NO_PERMISSIONS, normalizeMenuRoute } from "@/lib/data/nav-constants";

export const NAV_MENUS_TAG = "nav-menus";

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
export const fetchRoleMenusRaw = cache(async function fetchRoleMenusRaw(
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
        // Read fresh on every page load: a role's permissions (or the role being deactivated) must
        // apply to page guards at once, as they do in the API. `cache()` above shares the one
        // fetch between the layout and the page's permission check within a render.
        cache: "no-store",
      }
    );

    const data = await res.json();
    return data.success && Array.isArray(data.data) ? data.data : [];
  } catch {
    return [];
  }
});

// ── Sidebar navigation (GET /navigation/me) ────────────────────────────

export type NavigationResult =
  | { ok: true; data: NavigationPayload }
  | { ok: false; message: string; status?: number };

/**
 * The signed-in caller's sidebar, user details and company brand, all from the
 * database. The backend derives everything from the token and the selected
 * company (X-Company-Context, added by apiFetch), so switching company and
 * refreshing returns that company's brand and menus.
 *
 * Not cached across requests: the dashboard layout persists across client
 * navigations and re-renders only on a full load or router.refresh() (sign-in,
 * company switch), which is exactly when the menus must be fresh. `cache()`
 * shares the one call within a render.
 */
export const fetchNavigation = cache(async function fetchNavigation(): Promise<NavigationResult> {
  try {
    const res = await apiFetch<NavigationPayload>("/navigation/me", { cache: "no-store" });
    if (res.success && res.data && Array.isArray(res.data.groups)) {
      return { ok: true, data: res.data };
    }
    return { ok: false, message: res.message || "Navigation could not be loaded.", status: res.status };
  } catch {
    return { ok: false, message: "Navigation could not be loaded." };
  }
});

/**
 * API navigation groups → NavGroup[] for the Sidebar. The API has already
 * dropped what the caller may not view; this only reshapes and orders.
 * A null flag (no catalogue entry) is passed on as undefined, which the
 * Sidebar treats as visible — the same as the layout it replaces.
 */
export function navigationToNavGroups(groups: NavigationPayload["groups"]): NavGroup[] {
  const byOrder = <T extends { displayOrder?: number }>(a: T, b: T) =>
    (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
  const flag = (value: boolean | null | undefined) => (value == null ? undefined : value);

  const toItem = (item: ApiNavItem): NavItem => {
    const children = (item.children ?? []).slice().sort(byOrder).map(toItem);
    return {
      href:      normalizeMenuRoute(item.route),
      label:     item.label,
      icon:      item.icon ?? "",
      exact:     item.exact || undefined,
      canView:   flag(item.canView),
      canCreate: flag(item.canCreate),
      canEdit:   flag(item.canEdit),
      canDelete: flag(item.canDelete),
      children:  children.length ? children : undefined,
    };
  };

  return groups
    .slice()
    .sort(byOrder)
    .map((group) => ({
      label: group.label ?? undefined,
      items: group.items.slice().sort(byOrder).map(toItem),
    }))
    .filter((group) => group.items.length > 0);
}

// ── Converters ─────────────────────────────────────────────────────────

/**
 * A catalog entry without a route (e.g. "Finance data", permission key FINANCE_DATA) is a
 * permission switch, not a page. normalizeMenuRoute maps a blank route to /dashboard/overview,
 * so such an entry must not reach the permission map or the sidebar: one the role does not
 * hold would overwrite the dashboard's flags and send the role to /no-access.
 */
function hasPageRoute(menu: ApiMenuItem): boolean {
  return Boolean(menu.route?.trim());
}

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
    const children = (menu.children ?? []).filter((child) => child.canView && hasPageRoute(child));
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
    .filter((menu) => menu.canView && hasPageRoute(menu))
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(toNavItem);

  return items.length ? [{ items }] : [];
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
      key:        String(menu.idxno),
      kind:       menu.kind ?? "MENU",
      module:     menu.module ?? null,
      permissionKey: menu.permissionKey ?? null,
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
              key:        String(child.idxno),
              kind:       child.kind ?? "MENU",
              module:     child.module ?? null,
              permissionKey: child.permissionKey ?? null,
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
 * A role's grants keyed by catalogue entry id (as text), for the Access Control screen: every
 * entry, including API permissions and rights that have no route, keeps its own flags.
 */
export function extractPermissionsById(menus: ApiMenuItem[]): PermissionMap {
  const map: PermissionMap = {};
  const visit = (items: ApiMenuItem[]) => {
    for (const m of items) {
      map[String(m.idxno)] = { canView: m.canView, canCreate: m.canCreate, canEdit: m.canEdit, canDelete: m.canDelete };
      visit(m.children ?? []);
    }
  };
  visit(menus);
  return map;
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
    if (hasPageRoute(menu)) {
      map[normalizeMenuRoute(menu.route)] = {
        canView:   menu.canView,
        canCreate: menu.canCreate,
        canEdit:   menu.canEdit,
        canDelete: menu.canDelete,
      };
    }
    for (const child of (menu.children ?? []).filter(hasPageRoute)) {
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
