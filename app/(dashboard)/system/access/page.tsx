import RolesClient from "./_components/RolesClient";
import { getAllMenusAction, getRolesAction, getRoleMenusAction, getRoleUsersAction } from "@/actions/roles";
import { getSystemUsers } from "@/actions/system";
import { apiMenusToMenuTree, extractPermissions, getCurrentUserPermissions, NO_PERMISSIONS } from "@/lib/data/nav";
import type { MenuNode } from "@/lib/nav";
import type { ApiRoleUser, PermissionMap } from "@/lib/types/roles";
import { redirect } from "next/navigation";

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
 permissions: PermissionMap;
 users: RoleUser[];
 createdAt: string;
};

export type { MenuNode, ApiRoleUser, PermissionMap };

// ── Page ────────────────────────────────────────────────────────────────
export default async function RolesPage() {
 const permissions = await getCurrentUserPermissions();
 const pagePerms = permissions["/system/access"] ?? NO_PERMISSIONS;
 if (!pagePerms.canView) redirect("/dashboard");

 // Fetch menu catalog, roles, and all system users in parallel
 const [catalogResult, rolesResult, allSystemUsers] = await Promise.all([
 getAllMenusAction(),
 getRolesAction(),
 getSystemUsers(),
 ]);

 const catalogMenus = catalogResult.success ? (catalogResult.data ?? []) : [];
 const menuTree: MenuNode[] = apiMenusToMenuTree(catalogMenus);

 const apiRoles = rolesResult.success ? (rolesResult.data ?? []) : [];

 console.log("[RolesPage] API Roles:", JSON.stringify(apiRoles, null, 2));
 console.log("[RolesPage] All System Users:", JSON.stringify(allSystemUsers, null, 2));

 // Fetch per-role menus and users in parallel
 const [menusResults, usersResults] = await Promise.all([
 Promise.all(apiRoles.map((r) => getRoleMenusAction(r.roleCode))),
 Promise.all(apiRoles.map((r) => getRoleUsersAction(r.roleCode))),
 ]);

 const roles: Role[] = apiRoles.map((apiRole, i) => {
 const apiUsers = usersResults[i]?.data ?? [];
 console.log(`[RolesPage] Role ${apiRole.roleCode} users:`, JSON.stringify(apiUsers, null, 2));
 
 const users: RoleUser[] = apiUsers.map((u) => {
 const fullName = u.fullName || `${u.fname || ""} ${u.middleName || ""} ${u.otherName || ""}`.trim() || u.username || "Unknown";
 const fname = u.fname || fullName.split(" ")[0] || "U";
 const middleName = u.middleName || (fullName.split(" ")[1] ? fullName.split(" ")[1][0] : "");
 
 return {
 id: u.userId || String(u.idxno),
 name: fullName,
 email: u.email || "",
 status: u.isactive ? "active" : "inactive",
 initials: (fname?.[0] ?? "U").toUpperCase() + (middleName?.[0] ?? "").toUpperCase(),
 joinedAt: u.createdAt || "",
 };
 });

 return {
 id: apiRole.roleCode,
 name: apiRole.name,
 description: apiRole.description,
 userCount: users.length,
 permissions: extractPermissions(menusResults[i]?.data ?? []),
 users,
 createdAt: apiRole.createdAt ?? "",
 };
 });

 console.log("[RolesPage] Final roles:", JSON.stringify(roles, null, 2));

 return (
 <div className="p-6 h-full">
 <RolesClient roles={roles} menuTree={menuTree} allSystemUsers={allSystemUsers} />
 </div>
 );
}
