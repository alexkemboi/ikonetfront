import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { auth } from "@/lib/auth";
import { getInvestorMoneyFlowData } from "@/actions/investor";
import { normalizeRole, ROLE_NAME } from "@/lib/types/roles";
import type { RouterAttributionItem } from "@/lib/types/investor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Investor Portal | Beesmart Billing",
  description: "Partner revenue summary, maintenance charges, net payout and router attribution.",
};

const formatKES = (value: number): string =>
  new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(
    Number.isFinite(value) ? value : 0
  );

const formatDate = (value: string | null): string =>
  value ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export default async function InvestorPortalPage() {
  const session = await auth();
  const role = normalizeRole(session?.user?.role);

  // RB-5.1 access guard:
  //  - investor (04)     → allowed (own routers)
  //  - company roles      → allowed (own company revenue); billing detail stays SYSADMIN-only
  //                         (SYSADMIN or 01 → ADMIN; 02 → MANAGEMENT; 03 → STAFF)
  //  - customer (05)      → /portal/pppoe
  //  - unknown            → /no-access (fail closed)
  if (role === ROLE_NAME.CUSTOMER) redirect("/portal/pppoe");
  if (role === ROLE_NAME.UNKNOWN) redirect("/no-access");

  const data = await getInvestorMoneyFlowData();
  const revenue = data.revenue;
  const routerRows: RouterAttributionItem[] = revenue?.routerBreakdown ?? [];

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
                <table className="w-full text-sm">
                  <thead className="border-b text-left text-muted-foreground">
                    <tr>
                      <th className="py-2 pr-4 font-medium">Router</th>
                      <th className="py-2 pr-4 font-medium">Station</th>
                      <th className="py-2 pr-4 font-medium">Hotspot Revenue</th>
                      <th className="py-2 pr-4 font-medium">PPPoE Subscribers</th>
                      <th className="py-2 font-medium">Attributed Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {routerRows.map((row) => (
                      <tr key={row.routerId} className="border-b">
                        <td className="py-2 pr-4">{row.routerName || row.routerId}</td>
                        <td className="py-2 pr-4">{row.stationName || "—"}</td>
                        <td className="py-2 pr-4">{formatKES(row.hotspotRevenue)}</td>
                        <td className="py-2 pr-4">{row.pppoeSubscribers}</td>
                        <td className="py-2 font-medium">{formatKES(row.totalAttributedRevenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                <table className="w-full text-sm">
                  <thead className="border-b text-left text-muted-foreground">
                    <tr>
                      <th className="py-2 pr-4 font-medium">#</th>
                      <th className="py-2 pr-4 font-medium">Period</th>
                      <th className="py-2 pr-4 font-medium">Maintenance Due</th>
                      <th className="py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.snapshots.map((snapshot) => (
                      <tr key={snapshot.id} className="border-b">
                        <td className="py-2 pr-4">{snapshot.snapshotNumber}</td>
                        <td className="py-2 pr-4">{snapshot.periodYearMonth}</td>
                        <td className="py-2 pr-4">{formatKES(snapshot.totalMaintenanceDue)}</td>
                        <td className="py-2">
                          <Badge
                            variant={
                              snapshot.status === "PAID"
                                ? "default"
                                : snapshot.status === "FINALIZED"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {snapshot.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                <table className="w-full text-sm">
                  <thead className="border-b text-left text-muted-foreground">
                    <tr>
                      <th className="py-2 pr-4 font-medium">Name</th>
                      <th className="py-2 pr-4 font-medium">Code</th>
                      <th className="py-2 pr-4 font-medium">Effective</th>
                      <th className="py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.agreements.map((agreement) => (
                      <tr key={agreement.id} className="border-b">
                        <td className="py-2 pr-4">{agreement.name}</td>
                        <td className="py-2 pr-4">{agreement.agreementCode}</td>
                        <td className="py-2 pr-4">
                          {formatDate(agreement.effectiveStartDate)} → {formatDate(agreement.effectiveEndDate)}
                        </td>
                        <td className="py-2">
                          <Badge variant={agreement.status === "ACTIVE" ? "default" : "outline"}>
                            {agreement.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>
        )}
      </div>
    </div>
  );
}