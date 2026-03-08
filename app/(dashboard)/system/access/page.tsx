import RolesClient from "./_components/RolesClient";
import { getAllMenusAction, getRolesAction, getRoleMenusAction, getRoleUsersAction } from "@/actions/roles";
import { apiMenusToMenuTree, extractPermissions } from "@/lib/data/nav";
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
  // ── Full menu catalog (permission tree) ─────────────────────────────
  // Fetches ALL menus from the catalog endpoint so the permission tree
  // is always complete — regardless of which role the logged-in user has.
  const catalogResult = await getAllMenusAction();
  const catalogMenus  = catalogResult.success ? catalogResult.data : [];
  const menuTree: MenuNode[] = apiMenusToMenuTree(catalogMenus);

  // ── Roles + per-role permissions ────────────────────────────────────
  let roles: Role[] = [];

  try {
    const rolesResult = await getRolesAction();
    const apiRoles = rolesResult.success ? rolesResult.data : [];

    // Fetch menus and users for every role in parallel
    const [menusResults, usersResults] = await Promise.all([
      Promise.all(apiRoles.map((r) => getRoleMenusAction(r.roleCode))),
      Promise.all(apiRoles.map((r) => getRoleUsersAction(r.roleCode))),
    ]);

    roles = apiRoles.map((apiRole, i) => {
      const apiUsers = usersResults[i]?.data ?? [];
      const users: RoleUser[] = apiUsers.map((u) => ({
        id:       u.userId,
        name:     u.fullName,
        email:    u.email,
        status:   u.isActive ? "active" : "inactive",
        initials: (u.fname?.[0] ?? "U").toUpperCase() + (u.middleName?.[0] ?? "").toUpperCase(),
        joinedAt: u.createdAt,
      }));

      return {
        id:          apiRole.roleCode,
        name:        apiRole.name,
        description: apiRole.description,
        userCount:   users.length,
        permissions: extractPermissions(menusResults[i]?.data ?? []),
        users,
        createdAt:   apiRole.createdAt ?? "",
      };
    });
  } catch {
    roles = [];
  }

  return (
    <div className="p-6 h-full">
      <RolesClient roles={roles} menuTree={menuTree} />
    </div>
  );
}
