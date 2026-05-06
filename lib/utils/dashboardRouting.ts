/**
 * Central role-to-dashboard routing configuration.
 * All roles resolve to /dashboard — the single page renders role-appropriate content.
 */

export function resolveDashboardPathForRole(_roleCode: string | undefined | null): string {
  return "/dashboard";
}
