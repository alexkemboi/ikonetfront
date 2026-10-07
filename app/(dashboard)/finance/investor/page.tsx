import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { auth } from "@/lib/auth";
import { getInvestorMoneyFlowData } from "@/actions/investor";
import { getPermissionForRoute } from "@/lib/data/nav";
import { isPlatformAdminRole, normalizeRole, ROLE_NAME } from "@/lib/types/roles";
import type { RouterAttributionItem } from "@/lib/types/investor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AgreementsTable, BillingSnapshotsTable, RouterAttributionTable } from "./_components/InvestorTables";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Investor Portal | Beesmart Billing",
  description: "Partner revenue summary, maintenance charges, net payout and router attribution.",
};

const formatKES = (value: number): string =>
  new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(
    Number.isFinite(value) ? value : 0
  );

export default async function InvestorPortalPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; companyId?: string; investorId?: string }>;
}) {
  const session = await auth();
  const role = normalizeRole(session?.user?.role);
  const platformAdmin = isPlatformAdminRole(session?.user?.role);
  const params = await searchParams;
  const period = params.period && /^\d{4}-(0[1-9]|1[0-2])$/.test(params.period)
    ? params.period
    : undefined;

  // RB-5.1 access guard:
  //  - investor (04)     → allowed (own routers)
  //  - company roles      → allowed (own company revenue); billing detail stays SYSADMIN-only
  //                         (SYSADMIN or 01 → ADMIN; 02 → MANAGEMENT; 03 → STAFF)
  //  - customer (05)      → /portal/pppoe
  //  - unknown            → /no-access (fail closed)
  if (role === ROLE_NAME.CUSTOMER) redirect("/portal/pppoe");
  if (role === ROLE_NAME.UNKNOWN) redirect("/no-access");
  const pagePerms = await getPermissionForRoute("/finance/investor");
  if (!pagePerms.canView) redirect("/no-access");

  const data = await getInvestorMoneyFlowData({
    period,
    companyId: platformAdmin ? params.companyId : undefined,
    investorId: platformAdmin ? params.investorId : undefined,
  });
  const revenue = data.revenue;
  const routerRows: RouterAttributionItem[] = revenue?.routerBreakdown ?? [];

  // Owner decision 2026-10-05 (choice 7): an investor sees payout and maintenance
  // figures on their own login, alongside revenue and router attribution.
  const kpis = revenue
    ? [
        { label: "Total Gross Revenue", value: formatKES(revenue.totalGrossRevenue) },
        {
          label: revenue.investorId === null ? "Total Investor Payout Due" : "Net Investor Payout",
          value: formatKES(revenue.netInvestorPayout),
        },
        { label: "Maintenance Due", value: formatKES(revenue.totalMaintenanceDue) },
        { label: "Active PPPoE Subscribers", value: String(revenue.activePppoeSubscribers ?? 0) },
        { label: "Hotspot Gross", value: formatKES(revenue.hotspotGrossRevenue) },
        { label: "Hotspot Maint. Fee", value: formatKES(revenue.hotspotMaintenanceFee) },
        { label: "PPPoE Maint. Fee", value: formatKES(revenue.pppoeMaintenanceFee) },
      ]
    : [];

  return (
    <div className="min-h-screen p-4 text-foreground sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <span className="text-[11px] font-sans tabular-nums tracking-wider text-muted-foreground uppercase">
            PARTNER — INVESTOR PORTAL
          </span>
          <h1 className="text-3xl font-sans font-normal text-foreground">
            Money flow.
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Period {data.period} · Revenue, maintenance &amp; router attribution · Read-only
          </p>
        </div>

        <form method="get" className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4">
          <div className="space-y-1.5">
            <Label htmlFor="investor-period">Period</Label>
            <Input id="investor-period" name="period" type="month" defaultValue={data.period} className="w-44" />
          </div>
          {platformAdmin && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="investor-company-id">Company ID (optional)</Label>
                <Input
                  id="investor-company-id"
                  name="companyId"
                  defaultValue={params.companyId ?? ""}
                  placeholder="Company code"
                  className="w-48"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="investor-party-id">Investor ID (optional)</Label>
                <Input
                  id="investor-party-id"
                  name="investorId"
                  defaultValue={params.investorId ?? ""}
                  placeholder="Investor UUID"
                  className="w-56"
                />
              </div>
            </>
          )}
          <Button type="submit" variant="outline">Apply filters</Button>
          {platformAdmin && (
            <p className="w-full text-xs text-muted-foreground">
              Company and investor filters apply to the revenue summary; billing snapshots and agreements follow their backend list scope.
            </p>
          )}
        </form>

        {!data.anyAvailable && (
          <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            Investor endpoints are not reachable yet. {data.revenueMessage} {data.snapshotsMessage} {data.agreementsMessage}
          </div>
        )}

        {revenue && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {kpis.map((kpi) => (
              <Card key={kpi.label}>
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs font-medium text-muted-foreground">{kpi.label}</CardTitle>
                </CardHeader>
                <CardContent className="text-xl font-semibold">{kpi.value}</CardContent>
              </Card>
            ))}
          </div>
        )}

        {revenue !== null && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Router Attribution</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {routerRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">No router attribution for this period.</p>
              ) : (
                <RouterAttributionTable rows={routerRows} />
              )}
            </CardContent>
          </Card>
        )}

        {data.billingDetailsVisible && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Billing Snapshots</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {data.snapshots.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {data.snapshotsMessage || "No billing snapshots yet."}
                </p>
              ) : (
                <BillingSnapshotsTable rows={data.snapshots} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Agreements</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {data.agreements.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {data.agreementsMessage || "No agreements found."}
                </p>
              ) : (
                <AgreementsTable rows={data.agreements} />
              )}
            </CardContent>
          </Card>
        </div>
        )}
      </div>
    </div>
  );
}