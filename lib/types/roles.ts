/**
 * The four access flags stored per menu item.
 * Used both in the Roles admin UI and at the page level to guard actions.
 */
export type PermissionFlags = {
  canView:   boolean;
  canCreate: boolean;
  canEdit:   boolean;
  canDelete: boolean;
};

/**
 * A flat map from route → flags.
 * e.g. { "/system/roles": { canView: true, canCreate: false, ... } }
 * This is the shape we pass to client components for page-level checks.
 */
export type PermissionMap = Record<string, PermissionFlags>;

/**
 * Roles are data: a role is a row of the roles table (any number of them), and what it may do is
 * its grants in the permission catalogue. The dashboard never decides by role name: it asks the
 * signed-in user's access (lib/access.ts, from GET /navigation/me) or a role row's attributes.
 */

/** Menu/permission item returned by the /{roleCode}/menus endpoint */
export type ApiMenuItem = {
  /** Database primary key — required for POST /menus assignment calls */
  idxno: number;
  label: string;
  route: string;
  /** Material Design icon name — mapped to Lucide in the Sidebar's ICON_MAP */
  icon: string;
  sortOrder: number;
  /** MENU, API or RIGHT (permission catalogue kind) */
  kind?: string;
  module?: string | null;
  permissionKey?: string | null;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  children: ApiMenuItem[];
};

/** Payload sent to POST /{roleCode}/menus for each menu item */
export type MenuAssignment = {
  menuItemId: number;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
};

/** User returned by GET /{roleCode}/users */
export type ApiRoleUser = {
  idxno: number;
  username: string;
  userId: string;
  role: string;
  roleName: string;
  createdAt: string;
  isactive: boolean;
  fname: string;
  middleName: string;
  otherName: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  canLogin: boolean;
  /** Locked after five wrong passwords; an administrator unlocks it. */
  accountLocked?: boolean;
  companyId?: string | null;
  stationId?: string | null;
  /** Location without a station (with a station, the station's location). */
  locationId?: number | null;
  /** Investor party a Network Partner account is linked to; null until linked. */
  investorId?: string | null;
  /** STAFF, INVESTOR or CUSTOMER: the type of the user's role. */
  principalType?: string | null;
};

/** Raw role shape returned by the API */
export type ApiRole = {
  idxno: number;
  roleCode: string;
  name: string;
  description: string;
  createdAt: string | null;
  /** Stable key (equals the code for custom roles). */
  roleKey?: string | null;
  /** STAFF, INVESTOR or CUSTOMER */
  principalType?: string | null;
  /** PLATFORM, COMPANY or STATION */
  scopeLevel?: string | null;
  /** One of the built-in roles: cannot be deleted; code and type are fixed. */
  isSystem?: boolean;
  /** The platform super admin (every permission, protected). */
  isSuperAdmin?: boolean;
  isActive?: boolean;
  landingRoute?: string | null;
  updatedAt?: string | null;
};

/** The role row for a code (or role_key), from a list the API returned. */
export function findRole(roles: ApiRole[], code?: string | null): ApiRole | undefined {
  const c = (code ?? "").trim().toUpperCase();
  if (!c) return undefined;
  return roles.find((r) => r.roleCode.toUpperCase() === c || (r.roleKey ?? "").toUpperCase() === c);
}

/** The role is an investor login (roles.principal_type = INVESTOR). */
export function isInvestorRoleRow(roles: ApiRole[], code?: string | null): boolean {
  return findRole(roles, code)?.principalType === "INVESTOR";
}

/**
 * Roles staff management can offer: active, not the super admin (its own flow), not a customer
 * role (customer management). Whether the caller may assign each is still decided by the API.
 */
export function staffAssignableRoles(roles: ApiRole[]): ApiRole[] {
  return roles.filter((r) => r.isActive !== false && !r.isSuperAdmin && r.principalType !== "CUSTOMER");
}


export type AddRolePayload = {
  roleCode: string;
  name: string;
  description: string;
  /** STAFF (default), INVESTOR or CUSTOMER */
  principalType?: string;
  /** PLATFORM, COMPANY or STATION */
  scopeLevel?: string;
  landingRoute?: string;
  /** Codes of the roles that may assign this one (the super admin always may). */
  assignableBy?: string[];
};

/** Change a role; the code is fixed, omitted fields keep their value. */
export type UpdateRolePayload = {
  name?: string;
  description?: string;
  principalType?: string;
  scopeLevel?: string;
  landingRoute?: string;
  isActive?: boolean;
  assignableBy?: string[];
};

/** One sidebar layout row (navigation_menus): a section, an entry or a sub-entry. */
export type NavLayoutRow = {
  id: number;
  menuKey: string;
  label: string;
  parentId: number | null;
  portal: string;
  route: string | null;
  displayOrder: number;
  isActive: boolean;
  permissionKey: string | null;
};
