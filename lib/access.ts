/**
 * What the signed-in user's role may do, as GET /navigation/me reports it (roles and grants from
 * the database). Use it to show or hide actions and pages; the API decides on its own and refuses
 * anything the role does not hold.
 *
 * A permission key is an entry of the permission catalogue: API_* for API resources (actions map to
 * GET/POST/PUT+PATCH/DELETE), named rights such as SYSTEM_FEE_PAY, or a screen's key. The super
 * admin holds every key.
 */
export type AccessAction = "VIEW" | "CREATE" | "EDIT" | "DELETE";

export type NavAccess = {
  superAdmin: boolean;
  roleCode?: string | null;
  /** STAFF, INVESTOR or CUSTOMER */
  principalType?: string | null;
  /** PLATFORM, COMPANY or STATION */
  scopeLevel?: string | null;
  /** Where the role lands after signing in; null = its first sidebar entry. */
  landingRoute?: string | null;
  permissions: Record<string, AccessAction[]>;
};

/** Nothing granted: unknown, inactive or signed-out callers, and API failures (fail closed). */
export const NO_ACCESS: NavAccess = { superAdmin: false, permissions: {} };

/** May the role perform {@code action} on the permission {@code key}? */
export function can(access: NavAccess | null | undefined, key: string, action: AccessAction = "VIEW"): boolean {
  if (!access) return false;
  if (access.superAdmin) return true;
  return access.permissions?.[key]?.includes(action) ?? false;
}

/** Does the role hold a named right (View on a RIGHT entry)? */
export function holdsRight(access: NavAccess | null | undefined, key: string): boolean {
  return can(access, key, "VIEW");
}

export function isInvestorAccess(access: NavAccess | null | undefined): boolean {
  return access?.principalType === "INVESTOR";
}

export function isCustomerAccess(access: NavAccess | null | undefined): boolean {
  return access?.principalType === "CUSTOMER";
}

/** May work across companies (choose a company in the header): the super admin or a PLATFORM-scoped role. */
export function hasPlatformScope(access: NavAccess | null | undefined): boolean {
  return Boolean(access?.superAdmin || access?.scopeLevel === "PLATFORM");
}
