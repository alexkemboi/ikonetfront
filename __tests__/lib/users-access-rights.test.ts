import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NavAccess } from "@/lib/access";

/**
 * Users & Access Control shows tabs and actions from the role's grants (GET /navigation/me), never
 * from the role's code or name: a custom role gets exactly what it was granted.
 */
const state: { permissions: Record<string, { canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean }>; access: NavAccess } = {
  permissions: {},
  access: { superAdmin: false, permissions: {} },
};

vi.mock("@/lib/data/nav", () => ({
  getCurrentUserPermissions: async () => state.permissions,
  NO_PERMISSIONS: { canView: false, canCreate: false, canEdit: false, canDelete: false },
}));
vi.mock("@/lib/data/access", () => ({ getAccess: async () => state.access }));

const view = { canView: true, canCreate: false, canEdit: false, canDelete: false };

async function rightsFor(roleCode: string, permissions: NavAccess["permissions"], menus: typeof state.permissions) {
  state.access = { superAdmin: false, roleCode, permissions };
  state.permissions = menus;
  vi.resetModules();
  const mod = await import("@/app/(dashboard)/system/users/_lib/access");
  const rights = await mod.getUsersAccessRights();
  return { rights, tabs: mod.usersAccessTabs(rights).map((t) => t.label) };
}

describe("Users & Access Control rights come from grants", () => {
  beforeEach(() => vi.resetModules());

  it("a custom role with only session grants can view and end sessions, nothing else", async () => {
    const { rights, tabs } = await rightsFor(
      "NOC_SUPERVISOR",
      { API_SYSTEMUSERSCRUD_ROOT: ["VIEW"], API_USER_SESSIONS: ["VIEW", "DELETE"] },
      { "/system/users": view }
    );
    expect(rights.viewUsers).toBe(true);
    expect(rights.viewSessions).toBe(true);
    expect(rights.endSessions).toBe(true);
    expect(rights.createUsers).toBe(false);
    expect(rights.editUsers).toBe(false);
    expect(rights.invite).toBe(false);
    expect(rights.editPolicy).toBe(false);
    expect(rights.unlockAdministrators).toBe(false);
    expect(tabs).toEqual(["Users", "Sign-in Activity"]);
  });

  it("a role code that looks like the company admin gets nothing without grants", async () => {
    const { rights, tabs } = await rightsFor("01", {}, {});
    expect(rights.viewUsers).toBe(false);
    expect(rights.viewPolicy).toBe(false);
    expect(tabs).toEqual([]);
  });

  it("a role holding only Access Control sees only the Roles tab", async () => {
    const { rights, tabs } = await rightsFor("AUDITOR", {}, { "/system/access": view });
    expect(rights.viewUsers).toBe(false);
    expect(tabs).toEqual(["Roles & Permissions"]);
  });

  it("security settings follow API_SECURITY_POLICY together with the menu grant the API checks", async () => {
    const withMenu = await rightsFor("SECURITY_OFFICER", { API_SECURITY_POLICY: ["VIEW", "EDIT"] }, { "/system/users": view });
    expect(withMenu.rights.viewPolicy).toBe(true);
    expect(withMenu.rights.editPolicy).toBe(true);
    expect(withMenu.tabs).toEqual(["Security Settings"]);

    const withoutMenu = await rightsFor("SECURITY_OFFICER", { API_SECURITY_POLICY: ["VIEW", "EDIT"] }, {});
    expect(withoutMenu.rights.viewPolicy).toBe(false);
  });

  it("unlocking administrators follows its own permission, not the super admin flag", async () => {
    const { rights } = await rightsFor(
      "PLATFORM_SUPPORT",
      { API_SYSTEMUSERSCRUD_ROOT: ["VIEW"], API_AUTH_SYSADMINS: ["CREATE"] },
      { "/system/users": view }
    );
    expect(rights.access.superAdmin).toBe(false);
    expect(rights.unlockAdministrators).toBe(true);
  });

  it("the super admin flag (from the roles table) grants everything", async () => {
    state.access = { superAdmin: true, roleCode: "ANY_NAME", permissions: {} };
    state.permissions = {};
    const mod = await import("@/app/(dashboard)/system/users/_lib/access");
    const rights = await mod.getUsersAccessRights();
    expect(rights.viewUsers && rights.editPolicy && rights.endSessions && rights.invite).toBe(true);
    expect(mod.usersAccessTabs(rights)).toHaveLength(4);
  });
});
