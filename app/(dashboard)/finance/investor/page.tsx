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
import { getFeeReceivingAccount, getMyFees } from "@/actions/platformFees";
import { FeePayNow, feePaymentInstructions } from "@/components/finance/FeePayNow";
import { feeDate, kes, STANDING_CLASS, STANDING_LABEL } from "@/components/finance/systemFeeFormat";
import { getMyPortfolio } from "@/actions/investorPortfolio";
import InvestorPortfolioView from "@/components/investors/InvestorPortfolioView";
import MessageHistory from "@/components/investors/MessageHistory";
import { getMyMessages } from "@/actions/investorMessages";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Investor Portal | Beesmart Billing",
  description: "Partner revenue summary, maintenance charges, net payout and router attribution.",
};

const formatKES = (value: number): string =>
  new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(
    Number.isFinite(value) ? value : 0
  );

type Kpi = { label: string; value: string; hint?: string };

function KpiCard({ kpi, large = false }: { kpi: Kpi; large?: boolean }) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-xs font-medium text-muted-foreground">{kpi.label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={large ? "text-2xl font-semibold tabular-nums" : "text-xl font-semibold tabular-nums"}>{kpi.value}</p>
        {kpi.hint && <p className="mt-1 text-xs text-muted-foreground">{kpi.hint}</p>}
      </CardContent>
    </Card>
  );
}

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

  // Owner, 2026-10-31: an investor's page tells the whole story of their month (what their
  // routers made, what is theirs, what they owe) per router and per service.
  if (role === ROLE_NAME.INVESTOR) {
    const [{ portfolio, message }, fees, messages] = await Promise.all([getMyPortfolio(period), getMyFees(), getMyMessages()]);
    const owing = fees.filter((f) => f.balance.balance > 0);
    // the account is shown as the way to pay straight in, beside the M-Pesa prompt
    const account = owing.length > 0 ? await getFeeReceivingAccount() : null;
    return (
      <div className="min-h-screen p-4 text-foreground sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="text-[11px] tracking-wider text-muted-foreground uppercase">
                Partner — investor portal{portfolio ? ` · ${portfolio.investor.name}` : ""}
              </span>
              <h1 className="text-3xl font-normal">Money flow.</h1>
              <p className="mt-1 text-xs text-muted-foreground">
                What your routers made, what is yours, and what you owe the platform · read-only
              </p>
            </div>
            <form method="get" className="flex items-end gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="portfolio-period">Month</Label>
                <Input id="portfolio-period" name="period" type="month" defaultValue={portfolio?.period ?? period} className="w-44" />
              </div>
              <Button type="submit" variant="outline">Show</Button>
            </form>
          </div>

          {fees.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Your invoices</CardTitle>
                <p className="text-xs text-muted-foreground">
                  The system fee on each agreement: what the month-end statements charged, what you have paid, and what is
                  still owed. Pay with an M-Pesa prompt (it records itself) or straight into the account shown. The statement
                  PDFs are under Agreements below.
                </p>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm tabular-nums">
                  <thead className="text-xs text-muted-foreground">
                    <tr className="border-b border-border">
                      <th className="py-2 pr-3 font-medium">Agreement</th>
                      <th className="py-2 pr-3 text-right font-medium">Charged</th>
                      <th className="py-2 pr-3 text-right font-medium">Paid</th>
                      <th className="py-2 pr-3 text-right font-medium">Outstanding</th>
                      <th className="py-2 pr-3 font-medium">Standing</th>
                      <th className="py-2 font-medium">How to pay</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fees.map(({ balance }) => {
                      const owes = balance.balance > 0;
                      return (
                        <tr key={balance.agreementId} className="border-b border-border align-top">
                          <td className="py-2 pr-3">
                            <p className="font-medium">{balance.agreementCode}</p>
                            <p className="text-xs text-muted-foreground">{balance.companyName}</p>
                          </td>
                          <td className="py-2 pr-3 text-right">{kes(balance.charged)}</td>
                          <td className="py-2 pr-3 text-right">{kes(balance.paid)}</td>
                          <td className="py-2 pr-3 text-right font-medium">{kes(Math.max(balance.balance, 0))}</td>
                          <td className="py-2 pr-3">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STANDING_CLASS[balance.feeStatus]}`}>
                              {STANDING_LABEL[balance.feeStatus]}
                            </span>
                            {owes && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                Due {feeDate(balance.oldestDueDate)} · suspension from {feeDate(balance.suspendDate)}
                              </p>
                            )}
                          </td>
                          <td className="py-2">
                            {owes ? (
                              <div className="space-y-1">
                                <FeePayNow agreementId={balance.agreementId} agreementCode={balance.agreementCode}
                                  balance={balance.balance} account={account} label="Pay with M-Pesa prompt" />
                                {account && (
                                  <p className="text-xs text-muted-foreground">Or: {feePaymentInstructions(account, balance.agreementCode)}</p>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">Nothing owed</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {portfolio ? (
            <>
              <InvestorPortfolioView portfolio={portfolio} audience="investor" />
              <MessageHistory messages={messages} audience="investor" />
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
              {message || "Your figures could not be loaded."}
            </div>
          )}
        </div>
      </div>
    );
  }

  const data = await getInvestorMoneyFlowData({
    period,
    companyId: platformAdmin ? params.companyId : undefined,
    investorId: platformAdmin ? params.investorId : undefined,
  });
  const revenue = data.revenue;
  // what the signed-in investor owes the platform: investors were served above, so none here
  const myFees: Awaited<ReturnType<typeof getMyFees>> = [];
  const feeAccount = myFees.some((f) => f.balance.balance > 0) ? await getFeeReceivingAccount() : null;
  const routerRows: RouterAttributionItem[] = revenue?.routerBreakdown ?? [];

  // Owner decision 2026-10-05 (choice 7): an investor sees payout and maintenance
  // figures on their own login, alongside revenue and router attribution.
  // Owner, 2026-10-30: an investor's first figures are what their routers took in over the
  // month, then what is credited to them, the system fee on that, and what is left.
  const monthName = new Date(`${data.period}-01T00:00:00`).toLocaleString("en-KE", { month: "long", year: "numeric" });
  const investorView = revenue !== null && revenue.investorId !== null && revenue.routersMonthRevenue != null;
  const headline: Kpi[] = investorView && revenue
    ? [
        {
          label: "Your routers took in",
          value: formatKES(revenue.routersMonthRevenue ?? 0),
          hint: `${monthName}, whole month: hotspot, PPPoE and TV`,
        },
        {
          label: "Credited to you",
          value: formatKES(revenue.totalGrossRevenue),
          hint: "Payments taken while each router was yours",
        },
        {
          label: "System fee",
          value: formatKES(revenue.totalMaintenanceDue),
          hint: "On the amount credited to you, by your agreement",
        },
        {
          label: "Your net payout",
          value: formatKES(revenue.netInvestorPayout),
          hint: "Credited to you, less the system fee",
        },
      ]
    : [];
  const kpis: Kpi[] = revenue
    ? investorView
      ? [
          { label: "Hotspot credited", value: formatKES(revenue.hotspotGrossRevenue) },
          { label: "Hotspot fee", value: formatKES(revenue.hotspotMaintenanceFee) },
          { label: "Paying PPPoE customers", value: String(revenue.activePppoeSubscribers ?? 0) },
          { label: "PPPoE fee", value: formatKES(revenue.pppoeMaintenanceFee) },
        ]
      : [
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

        {headline.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {headline.map((kpi) => (
              <KpiCard key={kpi.label} kpi={kpi} large />
            ))}
          </div>
        )}

        {revenue && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {kpis.map((kpi) => (
              <KpiCard key={kpi.label} kpi={kpi} />
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

        {myFees.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">System fees you owe</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="text-xs text-muted-foreground">
                The maintenance fee of each month-end statement is owed to the platform. It is due on the 10th; new hotspot
                purchases and PPPoE renewals on your routers are suspended from the 15th while it is unpaid.
              </p>
              {myFees.map(({ balance, entries }) => (
                <div key={balance.agreementId} className="rounded-xl border border-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium">
                      {balance.companyName} · {balance.agreementCode}
                    </p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STANDING_CLASS[balance.feeStatus]}`}>
                      {STANDING_LABEL[balance.feeStatus]}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xl font-sans tabular-nums">{kes(Math.max(balance.balance, 0))}</p>
                    <FeePayNow
                      agreementId={balance.agreementId}
                      agreementCode={balance.agreementCode}
                      balance={balance.balance}
                      account={feeAccount}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {balance.balance > 0
                      ? `Due ${feeDate(balance.oldestDueDate)} · suspension from ${feeDate(balance.suspendDate)}`
                      : "Nothing outstanding"}
                    {" · "}charged {kes(balance.charged)} · paid {kes(balance.paid)}
                  </p>
                  {entries.length > 0 && (
                    <ul className="mt-3 space-y-1 text-sm">
                      {entries.map((e) => (
                        <li key={e.id} className="flex flex-wrap justify-between gap-2">
                          <span>
                            {feeDate(e.createdAt)} ·{" "}
                            {e.entryType === "CHARGE"
                              ? `Charge for ${e.period ?? "—"} (due ${feeDate(e.dueDate)})`
                              : e.entryType === "PAYMENT"
                                ? `Payment ${e.reference ?? ""}`
                                : "Adjustment"}
                          </span>
                          <span className="font-sans tabular-nums">{kes(e.amount)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
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