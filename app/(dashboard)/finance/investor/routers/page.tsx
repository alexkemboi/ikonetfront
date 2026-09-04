import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getInvestorRouters } from "@/actions/investor";
import { getPermissionForRoute } from "@/lib/data/nav";
import { normalizeRole, ROLE_NAME } from "@/lib/types/roles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Assigned Routers | Investor Portal",
  description: "Read-only view of routers assigned to an investor scope.",
};

const formatDateTime = (value: string | null): string =>
  value ? new Date(value).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

export default async function InvestorRoutersPage() {
  const session = await auth();
  const role = normalizeRole(session?.user?.role);

  // Investor 04 and Admin 01 allowed. Management only if backend grants the
  // route explicitly; staff/customer are redirected to their landings.
  if (role === ROLE_NAME.STAFF) redirect("/customers");
  if (role === ROLE_NAME.CUSTOMER) redirect("/portal/pppoe");
  if (role === ROLE_NAME.MANAGEMENT) {
    const routerPerm = await getPermissionForRoute("/finance/investor/routers");
    if (!routerPerm.canView) redirect("/analytics");
  }
  if (role !== ROLE_NAME.INVESTOR && role !== ROLE_NAME.ADMIN) redirect("/customers");

  const { routers, message } = await getInvestorRouters();

  return (
    <div className="min-h-screen p-4 text-foreground sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <span className="text-[11px] font-mono tracking-wider text-muted-foreground uppercase">
            PARTNER — INVESTOR ROUTERS
          </span>
          <h1 className="text-3xl font-serif font-semibold text-foreground">
            Assigned routers.
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Read-only inventory of routers assigned to this investor scope.
          </p>
        </div>

        {message && (
          <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            {message}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Router inventory</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {routers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No routers are currently assigned to this investor scope.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b text-left text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-4 font-medium">Router</th>
                    <th className="py-2 pr-4 font-medium">Model</th>
                    <th className="py-2 pr-4 font-medium">IP</th>
                    <th className="py-2 pr-4 font-medium">Station</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="py-2 pr-4 font-medium">Last online</th>
                    <th className="py-2 pr-4 font-medium">Uptime</th>
                    <th className="py-2 font-medium">Snapshot</th>
                  </tr>
                </thead>
                <tbody>
                  {routers.map((router) => {
                    const traits = router.snapshotTraits;
                    return (
                      <tr key={router.routerId} className="border-b">
                        <td className="py-2 pr-4 font-medium">{router.routerName || `Router ${router.routerId}`}</td>
                        <td className="py-2 pr-4">{router.model || "—"}</td>
                        <td className="py-2 pr-4 font-mono text-xs">{router.ipAddress || "—"}</td>
                        <td className="py-2 pr-4">{router.stationName || "—"}</td>
                        <td className="py-2 pr-4">
                          <Badge variant={router.status ? "default" : "destructive"}>
                            {router.status ? "Online" : "Offline"}
                          </Badge>
                        </td>
                        <td className="py-2 pr-4">{formatDateTime(router.lastOnline)}</td>
                        <td className="py-2 pr-4">{router.uptime || "—"}</td>
                        <td className="py-2">
                          {traits
                            ? `CPU ${traits.cpuUsage}% · ${traits.activePppoeSessions} PPPoE · ${traits.activeHotspotSessions} hotspot`
                            : "No telemetry"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}