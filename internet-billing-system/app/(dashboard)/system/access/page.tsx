import RolesClient from "./_components/RolesClient";
import { auth } from "@/lib/auth";
import { getRolesAction, getRoleMenusAction } from "@/actions/roles";
import { fetchRoleMenusRaw, apiMenusToMenuTree, extractPermissions } from "@/lib/data/nav";
import type { MenuNode } from "@/lib/nav";

export const metadata = { title: "Roles & Permissions — Beesmart" };

// ── UI types ────────────────────────────────────────────────────────────

export type RoleUser = {
  id: string;
  name: string;
  email: string;
  status: "active" | "inactive";
  initials: string;
  joinedAt: string;
};

export type Role = {
  id: string;
  name: string;
  description: string;
  userCount: number;
  /**
   * Permission IDs = route strings (e.g. "/dashboard", "/customers/active").
   * Populated from the menus API — routes where canView: true for this role.
   */
  permissions: string[];
  users: RoleUser[];
  createdAt: string;
};

// Re-export MenuNode so RolesClient can still import it from here if needed
export type { MenuNode };

// ── Page ────────────────────────────────────────────────────────────────
export default async function RolesPage() {
  const session = await auth();

  const roleCode = session?.user?.role    ?? "";
  const apiToken = session?.user?.apiToken ?? "";

  // ── Full menu catalog (permission tree) ─────────────────────────────
  // The API returns the complete menu catalog for any role code.
  // We use the current user's role — an admin will have the full set.
  // Cached with NAV_MENUS_TAG so revalidateTag("nav-menus") refreshes it
  // after permission assignment changes.
  const catalogMenus = await fetchRoleMenusRaw(roleCode, apiToken);
  const menuTree: MenuNode[] = apiMenusToMenuTree(catalogMenus);

  // ── Roles + per-role permissions ────────────────────────────────────
  let roles: Role[] = [];

  try {
    const rolesResult = await getRolesAction();
    const apiRoles = rolesResult.success ? rolesResult.data : [];

    // Fetch menus for every role in parallel to read their canView flags
    const menusResults = await Promise.all(
      apiRoles.map((r) => getRoleMenusAction(r.roleCode))
    );

    roles = apiRoles.map((apiRole, i) => ({
      id:          apiRole.roleCode,
      name:        apiRole.name,
      description: apiRole.description,
      userCount:   0,         // users endpoint not yet wired
      permissions: extractPermissions(menusResults[i]?.data ?? []),
      users:       [],        // users endpoint not yet wired
      createdAt:   apiRole.createdAt ?? "",
    }));
  } catch {
    roles = [];
  }

  return (
    <div className="p-6 h-full">
      <RolesClient roles={roles} menuTree={menuTree} />
    </div>
  );
}
