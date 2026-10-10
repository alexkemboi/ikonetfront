import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPermissionForRoute } from "@/lib/data/nav";
import { getNasRoutersData } from "@/actions/provisioning";
import { getRouterOverview } from "@/actions/routerOperations";
import { isPlatformAdminRole } from "@/lib/types/roles";
import type { RouterActionsRow } from "@/components/network/RouterActionsDropdown";
import { RouterOperationsView } from "./_components/RouterOperationsView";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Router — IBS",
  description: "Performance, revenue, users and maintenance for one router",
};

/**
 * One router's operations page: everything the routers table's "•••" menu used to hold,
 * plus figures, history charts, payments and what is configured on the router. The id is
 * network_routers.idxno, the same id the monitoring page uses.
 */
export default async function RouterOperationsPage({ params }: { params: Promise<{ id: string }> }) {
  const perms = await getPermissionForRoute("/network/routers");
  if (!perms.canView) redirect("/dashboard");

  const routerId = Number((await params).id);
  if (!Number.isInteger(routerId) || routerId <= 0) notFound();

  const [overview, session, list] = await Promise.all([
    getRouterOverview(routerId),
    auth(),
    getNasRoutersData(),
  ]);
  if (overview.status === 404) notFound();
  if (!overview.data) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div role="alert" className="mx-auto max-w-7xl rounded-lg border border-destructive/30 bg-destructive/5 p-5 text-sm">
          <h1 className="font-medium">Router unavailable</h1>
          <p className="mt-1 text-muted-foreground">{overview.error}</p>
        </div>
      </div>
    );
  }

  // The routers list row carries the links and tunnel fields the actions menu works with.
  const item = list.error ? undefined : list.routers.find((r) => Number(r.routerId) === routerId);
  const row: RouterActionsRow | null = item
    ? {
        id: item.id,
        deviceId: item.deviceId,
        routerId: item.routerId,
        name: item.name,
        model: item.model,
        status: item.status,
        managementIp: item.managementIp,
        winboxTunnelAddress: item.winboxTunnelAddress,
        webConsoleUrl: item.webConsoleUrl,
        tunnelExpiresAt: item.tunnelExpiresAt,
        links: item.links,
      }
    : null;

  return (
    <RouterOperationsView
      routerId={routerId}
      initialOverview={overview.data}
      actionsRow={row}
      canEdit={perms.canEdit}
      isSysadmin={isPlatformAdminRole(session?.user?.role)}
    />
  );
}
