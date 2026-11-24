/**
 * Role-to-dashboard routing. Each role's landing page lives in the database
 * (roles.landing_route; else the first sidebar entry), so the strict /dashboard
 * dispatcher and the legacy dashboard routes always agree.
 */
import { getLandingRoute } from "@/lib/data/access";

export async function resolveDashboardPath(): Promise<string> {
  return getLandingRoute();
}
