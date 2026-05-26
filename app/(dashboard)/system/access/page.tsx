import RolesClient from "./_components/RolesClient";
import { getAllMenusAction, getRolesAction, getRoleMenusAction, getRoleUsersAction } from "@/actions/roles";
import { getSystemUsers } from "@/actions/system";
import { apiMenusToMenuTree, extractPermissions } from "@/lib/data/nav";
import type { MenuNode } from "@/lib/nav";
import type { ApiRoleUser } from "@/lib/types/roles";

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
  permissions: string[];
  users: RoleUser[];
  createdAt: string;
};

export type { MenuNode, ApiRoleUser };

// ── Page ────────────────────────────────────────────────────────────────
export default async function RolesPage() {
  // Fetch menu catalog, roles, and all system users in parallel
  const [catalogResult, rolesResult, allSystemUsers] = await Promise.all([
    getAllMenusAction(),
    getRolesAction(),
    getSystemUsers(),
  ]);

  const catalogMenus = catalogResult.success ? (catalogResult.data ?? []) : [];
  const menuTree: MenuNode[] = apiMenusToMenuTree(catalogMenus);

  const apiRoles = rolesResult.success ? (rolesResult.data ?? []) : [];

  // Fetch per-role menus and users in parallel
  const [menusResults, usersResults] = await Promise.all([
    Promise.all(apiRoles.map((r) => getRoleMenusAction(r.roleCode))),
    Promise.all(apiRoles.map((r) => getRoleUsersAction(r.roleCode))),
  ]);

  const roles: Role[] = apiRoles.map((apiRole, i) => {
    const apiUsers = usersResults[i]?.data ?? [];
    const users: RoleUser[] = apiUsers.map((u) => ({
      id:       u.userId,
      name:     u.fullName,
      email:    u.email,
      status:   u.isactive ? "active" : "inactive",
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

  return (
    <div className="p-6 h-full">
      <RolesClient roles={roles} menuTree={menuTree} allSystemUsers={allSystemUsers} />
    </div>
  );
}
