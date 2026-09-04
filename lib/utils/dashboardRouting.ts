/**
 * Central role-to-dashboard routing configuration.
 * Every role resolves to its canonical landing route via the shared
 * `getLandingRouteForRole` helper — the same helper the strict `/dashboard`
 * dispatcher uses, so legacy dashboard routes never diverge.
 */

import { getLandingRouteForRole } from "@/lib/types/roles";

export function resolveDashboardPathForRole(roleCode: string | undefined | null): string {
  return getLandingRouteForRole(roleCode ?? undefined);
}