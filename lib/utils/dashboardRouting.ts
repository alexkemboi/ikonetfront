/**
 * Central role-to-dashboard routing configuration.
 *
 * To add a new role: add its roleCode as a key and the target path as the value.
 * All redirect guards across every dashboard sub-route read from this single map.
 */

const ROLE_DASHBOARD_MAP: Record<string, string> = {
  "01": "/dashboard/admin",       // sysadmin
  "02": "/dashboard/management",  // management / test
  "03": "/dashboard/staff",       // support staff
  "04": "/dashboard/customer",    // customer portal role
};

/** Fallback when a roleCode is not explicitly mapped */
const DEFAULT_DASHBOARD = "/dashboard/staff";

/**
 * Returns the canonical dashboard path for a given roleCode.
 * Unknown role codes fall back to the staff dashboard.
 */
export function resolveDashboardPathForRole(roleCode: string | undefined | null): string {
  if (!roleCode) return DEFAULT_DASHBOARD;
  return ROLE_DASHBOARD_MAP[roleCode] ?? DEFAULT_DASHBOARD;
}

/**
 * Returns true if the given roleCode is allowed to view the target dashboard path.
 * Used as a redirect guard in each dashboard sub-route.
 */
export function isAllowedOnDashboard(
  roleCode: string | undefined | null,
  currentPath: string
): boolean {
  return resolveDashboardPathForRole(roleCode) === currentPath;
}
