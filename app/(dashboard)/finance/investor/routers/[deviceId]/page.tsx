import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getInvestorRouterOverview } from "@/actions/routerOperations";
import { getPermissionForRoute } from "@/lib/data/nav";
import { isPlatformAdminRole, normalizeRole, ROLE_NAME } from "@/lib/types/roles";
import { RouterOperationsView } from "@/app/(dashboard)/network/routers/[id]/_components/RouterOperationsView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Router | Investor Portal",
  description: "Read-only figures, performance and payments of an assigned router.",
};

/**
 * An investor's router page (owner decision 2026-10-10): the staff router page without
 * actions, connection details or anything read from the router itself. The id is
 * network_device.id, as in the investor's router list.
 */
export default async function InvestorRouterPage({ params }: { params: Promise<{ deviceId: string }> }) {
  const session = await auth();
  const role = normalizeRole(session?.user?.role);
  if (role === ROLE_NAME.CUSTOMER) redirect("/portal/pppoe");
  if (role !== ROLE_NAME.INVESTOR && !isPlatformAdminRole(session?.user?.role)) redirect("/no-access");
  const perm = await getPermissionForRoute("/finance/investor/routers");
  if (!perm.canView) redirect("/no-access");

  const deviceId = Number((await params).deviceId);
  if (!Number.isInteger(deviceId) || deviceId <= 0) notFound();

  const overview = await getInvestorRouterOverview(deviceId);
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

  return (
    <RouterOperationsView
      routerId={overview.data.router.routerId}
      initialOverview={overview.data}
      canEdit={false}
      isSysadmin={false}
      investorDeviceId={deviceId}
      backHref="/finance/investor/routers"
    />
  );
}
