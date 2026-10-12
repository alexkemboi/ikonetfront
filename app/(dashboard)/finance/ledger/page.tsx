import {
  getAccountBalances,
  getChartOfAccountsTree,
  getLedgerPostings,
  getTrialBalance,
} from "@/actions/finance";
import LedgerExplorer from "@/components/finance/LedgerExplorer";
import { getPermissionForRoute } from "@/lib/data/nav";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Chart of Accounts & Ledger — SpeedLink",
  description: "Browse the GAAP chart of accounts, trial balance, and per-account ledger postings.",
};

export default async function LedgerPage() {
  const pagePerms = await getPermissionForRoute("/finance/ledger");
  if (!pagePerms.canView) redirect("/dashboard");

  const [tree, balances, trialBalance, postings] = await Promise.all([
    getChartOfAccountsTree(),
    getAccountBalances(),
    getTrialBalance(),
    getLedgerPostings({ page: 0, size: 20 }),
  ]);

  return (
    <div className="min-h-screen p-4 text-foreground sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <p className="text-[11px] font-sans tabular-nums tracking-wider text-muted-foreground uppercase">
            Finance — Ledger
          </p>
          <h1 className="text-3xl font-sans font-normal text-foreground">
            Chart of Accounts &amp; Ledger
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Live trial balance, GAAP account tree, and postings from the general ledger.
          </p>
        </div>

        <LedgerExplorer
          initialTree={tree}
          initialBalances={balances}
          initialTrialBalance={trialBalance}
          initialPostings={postings}
        />
      </div>
    </div>
  );
}