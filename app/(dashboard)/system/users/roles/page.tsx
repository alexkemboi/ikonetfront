import RolesClient from "../../access/_components/RolesClient";
import type { Role, RoleUser } from "../../access/_components/roleTypes";
import { getAllMenusAction, getNavigationLayoutAction, getRolesAction, getRoleMenusAction, getRoleUsersAction } from "@/actions/roles";
import { getSystemUsers } from "@/actions/system";
import { apiMenusToMenuTree, extractPermissionsById, getCurrentUserPermissions, NO_PERMISSIONS } from "@/lib/data/nav";
import { getAccess } from "@/lib/data/access";
import type { MenuNode } from "@/lib/nav";
import { redirect } from "next/navigation";

export const metadata = { title: "Roles & Permissions" };

// ── Page ────────────────────────────────────────────────────────────────
export default async function RolesPage() {
  const permissions = await getCurrentUserPermissions();
  const pagePerms = permissions["/system/access"] ?? NO_PERMISSIONS;
  if (!pagePerms.canView && !(await getAccess()).superAdmin) redirect("/system/users");

  // Role management (create, change, permissions) is for the super admin; the API enforces it too.
  const canMutate = (await getAccess()).superAdmin;

 // Fetch menu catalog, roles, and all system users in parallel
 const [catalogResult, rolesResult, allSystemUsers, navLayout] = await Promise.all([
 getAllMenusAction(),
 getRolesAction(),
 getSystemUsers(),
 getNavigationLayoutAction(),
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
 idxno: apiRole.idxno,
 principalType: apiRole.principalType ?? "STAFF",
 scopeLevel: apiRole.scopeLevel ?? null,
 isSystem: Boolean(apiRole.isSystem),
 isSuperAdmin: Boolean(apiRole.isSuperAdmin),
 isActive: apiRole.isActive !== false,
 landingRoute: apiRole.landingRoute ?? null,
 name: apiRole.name,
 description: apiRole.description,
 userCount: users.length,
 // keyed by catalogue entry id: API permissions and rights have no route
 permissions: extractPermissionsById(menusResults[i]?.data ?? []),
 users,
 createdAt: apiRole.createdAt ?? "",
 };
 });

 return (
 <div className="h-full">
 <RolesClient roles={roles} menuTree={menuTree} navLayout={navLayout} allSystemUsers={allSystemUsers} canMutate={canMutate} />
 </div>
 );
}
