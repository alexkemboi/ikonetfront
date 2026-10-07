import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getInvestorRouters } from "@/actions/investor";
import { getPermissionForRoute } from "@/lib/data/nav";
import { isPlatformAdminRole, normalizeRole, ROLE_NAME } from "@/lib/types/roles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InvestorRoutersTable } from "./_components/InvestorRoutersTable";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Assigned Routers | Investor Portal",
  description: "Read-only view of routers assigned to an investor scope.",
};

export default async function InvestorRoutersPage() {
  const session = await auth();
  const role = normalizeRole(session?.user?.role);

  if (role === ROLE_NAME.CUSTOMER) redirect("/portal/pppoe");
  if (role !== ROLE_NAME.INVESTOR && !isPlatformAdminRole(session?.user?.role)) {
    redirect("/no-access");
  }
  const routerPerm = await getPermissionForRoute("/finance/investor/routers");
  if (!routerPerm.canView) redirect("/no-access");

  const { routers, message } = await getInvestorRouters();

  return (
    <div className="min-h-screen p-4 text-foreground sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <span className="text-[11px] font-sans tabular-nums tracking-wider text-muted-foreground uppercase">
            PARTNER — INVESTOR ROUTERS
          </span>
          <h1 className="text-3xl font-sans font-normal text-foreground">
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
              <InvestorRoutersTable routers={routers} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}