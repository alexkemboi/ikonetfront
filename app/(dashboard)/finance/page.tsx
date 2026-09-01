import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  CheckCircle2,
  DollarSign,
  Landmark,
  TrendingDown,
  TrendingUp,
  Wallet,
  Wifi,
  XCircle,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLiveExecutiveDashboardData, getTrialBalance } from "@/actions/finance";
import { getPermissionForRoute } from "@/lib/data/nav";
import type { AccountPosting } from "@/lib/types/finance";
import { cn } from "@/lib/utils";
import FinanceToolbar from "./_components/FinanceToolbar";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Financial Dashboard — Beesmart Billing",
  description:
    "Live profit & loss, M-Pesa clearing balance, trial balance invariant, and recent ledger transactions.",
};

interface FinancePageProps {
  searchParams: Promise<{ from?: string; to?: string }>;
}

function formatKes(n: number): string {
  return `KES ${n.toLocaleString()}`;
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4 px-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {title}
            </p>
            <p className="text-2xl font-bold text-foreground mt-1 tabular-nums">
              {value}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          </div>
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
              color
            )}
          >
            <Icon className="w-5 h-5 text-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function FinancePage({ searchParams }: FinancePageProps) {
  const pagePerms = await getPermissionForRoute("/finance");
  if (!pagePerms.canView) redirect("/dashboard");

  const { from, to } = await searchParams;
  const [dashboard, trialBalance] = await Promise.all([
    getLiveExecutiveDashboardData(from, to),
    getTrialBalance(),
  ]);

  const { pnl, recentTransactions, clearingBalance } = dashboard;
  const positive = pnl.netProfit >= 0;

  return (
    <div className="space-y-6 p-8 pt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Badge className="bg-primary/10 text-primary border-primary/20 text-xs mb-1" variant="outline">
            Finance
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight">Executive Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Profit &amp; Loss · M-Pesa Clearing · Trial Balance · Live Ledger
          </p>
        </div>
        <FinanceToolbar from={from} to={to} />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Revenue"
          value={formatKes(pnl.totalRevenue)}
          subtitle={`${new Date(pnl.startDate).toLocaleDateString()} - ${new Date(pnl.endDate).toLocaleDateString()}`}
          icon={DollarSign}
          color="bg-primary"
        />
        <StatCard
          title="Total Expenses"
          value={formatKes(pnl.totalExpenses)}
          subtitle="All categories"
          icon={Wallet}
          color="bg-destructive"
        />
        <StatCard
          title="Net Profit"
          value={formatKes(pnl.netProfit)}
          subtitle={positive ? "Profitable" : "Loss"}
          icon={positive ? TrendingUp : TrendingDown}
          color={positive ? "bg-success" : "bg-destructive"}
        />
        <StatCard
          title="PPPoE Revenue"
          value={formatKes(pnl.pppoeRevenue ?? 0)}
          subtitle="Monthly subscriptions"
          icon={Wifi}
          color="bg-success"
        />
        <StatCard
          title="Hotspot Revenue"
          value={formatKes(pnl.hotspotRevenue ?? 0)}
          subtitle="Pay-as-you-go sessions"
          icon={Zap}
          color="bg-warning"
        />
      </div>

      {/* Trial Balance + Clearing */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 h-full">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Trial Balance</CardTitle>
              {trialBalance && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    trialBalance.isBalanced
                      ? "bg-success/10 text-success border-success/20"
                      : "bg-destructive/10 text-destructive border-destructive/20"
                  )}
                >
                  {trialBalance.isBalanced ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Balanced
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3 mr-1" /> Unbalanced
                    </>
                  )}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {trialBalance ? (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Debits</span>
                  <span className="font-medium tabular-nums">{formatKes(trialBalance.debits)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Credits</span>
                  <span className="font-medium tabular-nums">{formatKes(trialBalance.credits)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delta</span>
                  <span
                    className={cn(
                      "font-medium tabular-nums",
                      trialBalance.delta !== 0 ? "text-destructive" : "text-success"
                    )}
                  >
                    {formatKes(Math.abs(trialBalance.delta))}
                  </span>
                </div>
                <div className="border-t pt-3 mt-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                    Accounts ({trialBalance.accounts.length})
                  </p>
                  <div className="max-h-[200px] overflow-y-auto space-y-1">
                    {trialBalance.accounts.map((acct) => (
                      <div key={acct.code} className="flex justify-between text-xs py-1">
                        <span className="text-muted-foreground truncate">
                          {acct.code} — {acct.name}
                        </span>
                        <span className="font-medium tabular-nums">{formatKes(acct.balance)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No trial balance data</p>
            )}
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">M-Pesa Clearing · 1110</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col h-[calc(100%-4rem)]">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Clearing Balance
                </p>
                <p className="text-3xl font-bold text-foreground mt-1 tabular-nums">
                  {formatKes(clearingBalance)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Account 1110 — mobile money awaiting reconciliation to bank
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center shrink-0">
                <Landmark className="w-5 h-5 text-foreground" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              The Payments Ledger binds to this account, so every confirmed M-Pesa
              confirmation appears here as a posting.
            </p>
            <div className="mt-auto pt-4">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs w-full"
                asChild
              >
                <a href="/finance/payments">Open payments ledger</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent transactions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent Transactions</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Latest 10 ledger postings · {new Date(pnl.startDate).toLocaleDateString()} -{" "}
            {new Date(pnl.endDate).toLocaleDateString()}
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Date
                  </th>
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Account
                  </th>
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Source
                  </th>
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground hidden sm:table-cell">
                    Memo
                  </th>
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground hidden md:table-cell">
                    Service
                  </th>
                  <th className="text-right px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.length > 0 ? (
                  recentTransactions.map((p: AccountPosting) => (
                    <tr
                      key={p.id}
                      className="transition-colors hover:bg-muted/30 border-b border-border last:border-0"
                    >
                      <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                        {p.occurredAt.replace("T", " ").slice(0, 16)}
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold text-amber-500 text-xs">
                        {p.accountCode}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{p.sourceType}</td>
                      <td className="px-4 py-3 text-xs text-foreground hidden sm:table-cell max-w-[220px] truncate">
                        {p.memo || "—"}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px]">
                          {p.serviceType || "—"}
                        </span>
                      </td>
                      <td
                        className={cn(
                          "px-5 py-3 text-right font-bold text-xs tabular-nums",
                          p.amount < 0 ? "text-success" : "text-foreground"
                        )}
                      >
                        {p.amount < 0 ? "-" : "+"}{formatKes(Math.abs(p.amount))}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-12 text-center text-sm text-muted-foreground"
                    >
                      No transactions recorded in this period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}