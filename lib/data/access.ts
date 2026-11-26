/**
 * Server-side access of the signed-in user (server components and route handlers).
 * Shares the one GET /navigation/me call of the render with the dashboard layout.
 */
import { redirect } from "next/navigation";
import { fetchNavigation, normalizeMenuRoute } from "@/lib/data/nav";
import { NO_ACCESS, type NavAccess } from "@/lib/access";

export async function getAccess(): Promise<NavAccess> {
  const nav = await fetchNavigation();
  // token refused (access changed since sign-in): sign out, as the dashboard layout does
  if (!nav.ok && nav.status === 401) redirect("/signout?reason=permissions-changed");
  return nav.ok && nav.data.access ? nav.data.access : NO_ACCESS;
}

/**
 * Where the signed-in user lands: their role's landing page (roles.landing_route), else the first
 * entry of their sidebar, else /no-access (an unguarded page, so no redirect loop).
 */
export async function getLandingRoute(): Promise<string> {
  const nav = await fetchNavigation();
  if (!nav.ok || !nav.data.access?.roleCode) return "/no-access";
  const configured = nav.data.access.landingRoute?.trim();
  if (configured) return configured;
  const first = nav.data.groups.flatMap((g) => g.items)[0];
  return first ? normalizeMenuRoute(first.route) : "/no-access";
}
