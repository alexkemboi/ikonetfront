import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getLandingRoute } from "@/lib/data/access";
import { getPermissionForRoute } from "@/lib/data/nav";

export const dynamic = "force-dynamic";

/**
 * Strict dashboard dispatcher.
 *
 * Redirects to the caller's landing route only when that route is viewable in
 * the API-driven catalog. An unknown role, an unseeded catalog, a transient
 * menu-fetch failure, or a landing route the caller cannot view all resolve to
 * the unguarded `/no-access` page — so a guarded page and this dispatcher can
 * never redirect to each other in a loop.
 */
export default async function DashboardDispatcherPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const landing = await getLandingRoute();
  if (landing === "/no-access") {
    redirect("/no-access");
  }

  const landingPerms = await getPermissionForRoute(landing);
  if (!landingPerms.canView) {
    redirect("/no-access");
  }

  redirect(landing);
}
