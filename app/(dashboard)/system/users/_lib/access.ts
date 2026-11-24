import { cache } from "react";
import { getCurrentUserPermissions, NO_PERMISSIONS } from "@/lib/data/nav";
import { getAccess } from "@/lib/data/access";
import { can, type NavAccess } from "@/lib/access";
import type { PermissionFlags } from "@/lib/types/roles";

export type UsersAccessRights = {
  access: NavAccess;
  /** The Users & Access Control entry itself (menu SYSTEM_USERS). */
  menu: PermissionFlags;
  /** The Roles & Permissions tab (menu SYSTEM_ACCESS). */
  roles: PermissionFlags;
  viewUsers: boolean;
  createUsers: boolean;
  editUsers: boolean;
  deleteUsers: boolean;
  changeRoles: boolean;
  unlock: boolean;
  resetPassword: boolean;
  viewSessions: boolean;
  endSessions: boolean;
  invite: boolean;
  manageInvitations: boolean;
  viewPolicy: boolean;
  editPolicy: boolean;
  unlockAdministrators: boolean;
};

/**
 * What the signed-in user may do in Users & Access Control, from their role's grants (the API
 * checks every action again). Shared by the section layout and its pages within one render.
 */
export const getUsersAccessRights = cache(async (): Promise<UsersAccessRights> => {
  const [permissions, access] = await Promise.all([getCurrentUserPermissions(), getAccess()]);
  const menu = permissions["/system/users"] ?? NO_PERMISSIONS;
  const roles = permissions["/system/access"] ?? NO_PERMISSIONS;
  // the API checks the menu grant (SYSTEM_USERS) as well as each endpoint's own permission
  const inMenu = menu.canView || access.superAdmin;
  const viewUsers = inMenu && can(access, "API_SYSTEMUSERSCRUD_ROOT", "VIEW");
  return {
    access,
    menu,
    roles,
    viewUsers,
    createUsers: viewUsers && can(access, "API_SYSTEMUSERSCRUD_ROOT", "CREATE"),
    editUsers: viewUsers && can(access, "API_SYSTEMUSERSCRUD_ROOT", "EDIT"),
    deleteUsers: viewUsers && can(access, "API_SYSTEMUSERSCRUD_ROOT", "DELETE"),
    changeRoles: viewUsers && can(access, "API_SYSTEMUSERSCRUD_ROLE", "EDIT"),
    unlock: viewUsers && can(access, "API_SYSTEMUSERSCRUD_UNLOCK", "CREATE"),
    resetPassword: viewUsers && can(access, "API_SYSTEMUSERSCRUD_RESET_PASSWORD", "CREATE"),
    viewSessions: viewUsers && can(access, "API_USER_SESSIONS", "VIEW"),
    endSessions: viewUsers && can(access, "API_USER_SESSIONS", "DELETE"),
    invite: viewUsers && can(access, "API_USER_INVITATIONS", "CREATE"),
    manageInvitations: viewUsers && can(access, "API_USER_INVITATIONS", "EDIT"),
    viewPolicy: inMenu && can(access, "API_SECURITY_POLICY", "VIEW"),
    editPolicy: inMenu && can(access, "API_SECURITY_POLICY", "EDIT"),
    unlockAdministrators: inMenu && can(access, "API_AUTH_SYSADMINS", "CREATE"),
  };
});

export function usersAccessTabs(rights: UsersAccessRights) {
  return [
    { href: "/system/users", label: "Users", show: rights.viewUsers },
    { href: "/system/users/roles", label: "Roles & Permissions", show: rights.roles.canView || rights.access.superAdmin },
    { href: "/system/users/security", label: "Security Settings", show: rights.viewPolicy },
    { href: "/system/users/activity", label: "Sign-in Activity", show: rights.viewUsers },
  ]
    .filter((tab) => tab.show)
    .map(({ href, label }) => ({ href, label }));
}
