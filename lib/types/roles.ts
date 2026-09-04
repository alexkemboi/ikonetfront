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

/** Menu/permission item returned by the /{roleCode}/menus endpoint */
export type ApiMenuItem = {
  /** Database primary key — required for POST /menus assignment calls */
  idxno: number;
  label: string;
  route: string;
  /** Material Design icon name — mapped to Lucide in the Sidebar's ICON_MAP */
  icon: string;
  sortOrder: number;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  children: ApiMenuItem[];
};

/**
 * Role names as they appear in the JWT / session / users.role column
 * (issued by the Spring Boot backend).
 */
export const ROLE_NAME = {
  ADMIN:      "ADMIN",
  MANAGEMENT: "MANAGEMENT",
  STAFF:      "STAFF",
  INVESTOR:   "INVESTOR",
  CUSTOMER:   "CUSTOMER",
} as const;

export type RoleName = (typeof ROLE_NAME)[keyof typeof ROLE_NAME];

/**
 * Canonical role codes used in backend URL paths and DB lookups
 * (e.g. /system-setup/{code}/menus, /system-setup/{code}/users).
 * Keep these in sync with the codes expected by the Spring Boot
 * SystemSetupController.
 */
export const ROLE_CODE = {
  [ROLE_NAME.ADMIN]:      "01",
  [ROLE_NAME.MANAGEMENT]: "02",
  [ROLE_NAME.STAFF]:      "03",
  [ROLE_NAME.INVESTOR]:   "04",
  [ROLE_NAME.CUSTOMER]:   "05",
} as const;

export type RoleCode = (typeof ROLE_CODE)[RoleName];

/**
 * Normalize a role value (numeric code, name, or legacy value) to a canonical
 * ROLE_NAME. Handles:
 *   - Numeric codes: "01" → ADMIN, "02" → MANAGEMENT, "03" → STAFF, "04" → INVESTOR, "05" → CUSTOMER
 *   - Names/authorities: "ADMIN", "ROLE_ADMIN", "SYSADMIN", etc.
 *   - Falsy/unknown → STAFF (safe default)
 */
export function normalizeRole(role?: string | null): RoleName {
  if (!role) return ROLE_NAME.STAFF;

  const upper = role.toUpperCase().trim();

  // Numeric codes
  if (upper === "01") return ROLE_NAME.ADMIN;
  if (upper === "02") return ROLE_NAME.MANAGEMENT;
  if (upper === "03") return ROLE_NAME.STAFF;
  if (upper === "04") return ROLE_NAME.INVESTOR;
  if (upper === "05") return ROLE_NAME.CUSTOMER;

  // String names — match exact or alias
  if (
    upper === ROLE_NAME.ADMIN ||
    upper === "ROLE_ADMIN" ||
    upper === "ROLE_LEGACY_ADMIN" ||
    upper === "SYSADMIN" ||
    upper === "ROLE_SYSADMIN"
  ) return ROLE_NAME.ADMIN;
  if (upper === ROLE_NAME.MANAGEMENT || upper === "ROLE_STAFF_ADMIN") return ROLE_NAME.MANAGEMENT;
  if (upper === ROLE_NAME.STAFF || upper === "ROLE_STAFF" || upper === "ROLE_FINANCE_MANAGER") return ROLE_NAME.STAFF;
  if (upper === ROLE_NAME.INVESTOR || upper === "ROLE_INVESTOR") return ROLE_NAME.INVESTOR;
  if (upper === ROLE_NAME.CUSTOMER || upper === "ROLE_CUSTOMER") return ROLE_NAME.CUSTOMER;

  return ROLE_NAME.STAFF;
}

/**
 * Convert a role name (as it appears in the JWT / session.user.role)
 * to the corresponding backend role code. Used when constructing
 * API URLs that include the role code in the path.
 *
 * Falls back to the STAFF code for unknown values so the UI degrades
 * to the lowest-privilege menu rather than failing entirely.
 */
export function roleNameToCode(name: string | null | undefined): string {
  const normalized = normalizeRole(name);
  return ROLE_CODE[normalized] ?? ROLE_CODE.STAFF;
}

export function getLandingRouteForRole(role?: string | null): string {
  switch (normalizeRole(role)) {
    case ROLE_NAME.ADMIN:
      return "/dashboard/overview";
    case ROLE_NAME.MANAGEMENT:
      return "/analytics";
    case ROLE_NAME.STAFF:
      return "/customers";
    case ROLE_NAME.INVESTOR:
      return "/finance/investor";
    case ROLE_NAME.CUSTOMER:
      return "/portal/pppoe";
    default:
      return "/customers";
  }
}

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
};

/** Raw role shape returned by the API */
export type ApiRole = {
  idxno: number;
  roleCode: string;
  name: string;
  description: string;
  createdAt: string | null;
};


export type AddRolePayload = {
  roleCode: string;
  name: string;
  description: string;
};
