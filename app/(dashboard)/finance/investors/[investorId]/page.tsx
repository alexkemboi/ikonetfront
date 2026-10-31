import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Settings2, UserRound } from "lucide-react";

import { auth } from "@/lib/auth";
import { getInvestorPortfolio } from "@/actions/investorPortfolio";
import { isPlatformAdminRole, normalizeRole, ROLE_NAME } from "@/lib/types/roles";
import InvestorPortfolioView from "@/components/investors/InvestorPortfolioView";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const dynamic = "force-dynamic";
export const metadata = { title: "Investor" };

/**
 * One investor, for the administrators (owner request, 2026-10-31): the routers they hold,
 * what each made in the month, and the agreements company by company. A SYSADMIN sees every
 * company (or the one selected in the top bar); a company admin sees their own company's part.
 * Setting the investor up stays on Finance > Investors (Manage).
 */
export default async function InvestorDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ investorId: string }>;
  searchParams: Promise<{ period?: string }>;
}) {
  const session = await auth();
  const role = session?.user?.role ?? "";
  const isPlatformAdmin = isPlatformAdminRole(role);
  const isCompanyAdmin = normalizeRole(role) === ROLE_NAME.ADMIN && !isPlatformAdmin;
  if (!isPlatformAdmin && !isCompanyAdmin) redirect("/dashboard");

  const { investorId } = await params;
  const { period } = await searchParams;
  const { portfolio, message } = await getInvestorPortfolio(investorId, period);

  return (
    <div className="min-h-screen p-4 text-foreground sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <Link href="/finance/investors" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Investors
        </Link>

        {!portfolio ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
            {message || "This investor could not be loaded."}
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="text-[11px] tracking-wider text-muted-foreground uppercase">
                  Investor · {portfolio.investor.code}
                  {portfolio.companyCode ? ` · ${portfolio.companyCode} only` : " · all companies"}
                </span>
                <h1 className="flex items-center gap-3 text-3xl font-normal">
                  {portfolio.investor.name}
                  <Badge variant={portfolio.investor.status === "ACTIVE" ? "default" : "secondary"}>
                    {portfolio.investor.status === "ACTIVE" ? "Active" : "Retired"}
                  </Badge>
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {[portfolio.investor.contactName, portfolio.investor.phone, portfolio.investor.email].filter(Boolean).join(" · ") ||
                    "No contact recorded"}
                </p>
              </div>
              <div className="flex flex-wrap items-end gap-3">
                <form method="get" className="flex items-end gap-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="portfolio-period">Month</Label>
                    <Input id="portfolio-period" name="period" type="month" defaultValue={portfolio.period} className="w-44" />
                  </div>
                  <Button type="submit" variant="outline">Show</Button>
                </form>
                <Button asChild variant="outline">
                  <Link href={`/finance/investors?manage=${portfolio.investor.id}`}>
                    <Settings2 className="mr-2 size-4" /> Manage agreements and routers
                  </Link>
                </Button>
              </div>
            </div>

            <InvestorPortfolioView portfolio={portfolio} audience="admin" />

            {isPlatformAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Login accounts</CardTitle>
                </CardHeader>
                <CardContent>
                  {portfolio.accounts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No login yet. Under System &gt; System Users, add a NETWORK_PARTNER account and choose this investor.
                    </p>
                  ) : (
                    <ul className="space-y-1 text-sm">
                      {portfolio.accounts.map((a) => (
                        <li key={a.username} className="flex items-center gap-2">
                          <UserRound className="size-4 text-muted-foreground" />
                          {a.username}
                          {a.fullName ? ` · ${a.fullName}` : ""}
                          {!a.active && <Badge variant="secondary">inactive</Badge>}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
