"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FilterX,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getLedgerPostings } from "@/actions/finance";
import type {
  AccountBalanceProjection,
  AccountPosting,
  ChartOfAccountNode,
  SpringPage,
  TrialBalanceResponse,
} from "@/lib/types/finance";

const DEFAULT_CATEGORY_ORDER = ["ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE"];

interface Props {
  initialTree: Record<string, ChartOfAccountNode[]>;
  initialBalances: AccountBalanceProjection[];
  initialTrialBalance: TrialBalanceResponse | null;
  initialPostings: SpringPage<AccountPosting>;
}

function flattenAccounts(nodes: ChartOfAccountNode[] | undefined): ChartOfAccountNode[] {
  if (!nodes) return [];
  return nodes.flatMap((n) => [n, ...flattenAccounts(n.children)]);
}

function formatKsh(n: number): string {
  return `Ksh ${Math.abs(n).toLocaleString()}`;
}

export default function LedgerExplorer({
  initialTree,
  initialBalances,
  initialTrialBalance,
  initialPostings,
}: Props) {
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [postings, setPostings] = useState<SpringPage<AccountPosting>>(initialPostings);
  const [isLoading, setIsLoading] = useState(false);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      (Object.keys(initialTree).length > 0 ? Object.keys(initialTree) : DEFAULT_CATEGORY_ORDER).map(
        (key) => [key, true]
      )
    )
  );
  const mountedRef = useRef(false);
  const requestRef = useRef(0);

  const accountBalanceMap = useMemo(
    () => new Map((initialBalances ?? []).map((b) => [b.accountCode, b.balance])),
    [initialBalances]
  );

  const getBalance = useCallback(
    (code: string): number => accountBalanceMap.get(code) ?? 0,
    [accountBalanceMap]
  );

  const categoryKeys = useMemo(
    () => (Object.keys(initialTree).length > 0 ? Object.keys(initialTree) : []),
    [initialTree]
  );
  const categoryCounts = useMemo(
    () => Object.fromEntries(categoryKeys.map((key) => [key, flattenAccounts(initialTree[key]).length])),
    [categoryKeys, initialTree]
  );
  const allAccounts = useMemo(
    () =>
      categoryKeys.flatMap((key) => flattenAccounts(initialTree[key])).filter((n) => n.isActive),
    [categoryKeys, initialTree]
  );

  // Debounced refetch driven purely by filter state. The server already
  // supplies initialPostings on first mount (skipped); any subsequent change
  // to the account filter or date range refetches page 0. A monotonic request
  // token discards out-of-order responses so a slow earlier request can never
  // overwrite a newer one.
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    const token = ++requestRef.current;
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const page = await getLedgerPostings({
          accountCode: selectedCode || undefined,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
          page: 0,
          size: 20,
        });
        if (token === requestRef.current) {
          setPostings(page);
          setIsLoading(false);
        }
      } catch {
        if (token === requestRef.current) setIsLoading(false);
      }
    }, 300);
    return () => {
      clearTimeout(timer);
    };
  }, [selectedCode, fromDate, toDate]);

  const handleSelect = (code: string) => {
    setSelectedCode(code === selectedCode ? null : code);
  };

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
          <div className="flex items-center gap-2">
            {initialTrialBalance ? (
              initialTrialBalance.isBalanced ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-destructive" />
              )
            ) : (
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-[11px] font-mono tracking-wider text-muted-foreground uppercase">
              {initialTrialBalance
                ? initialTrialBalance.isBalanced
                  ? "Balanced Invariant"
                  : "Out of Balance"
                : "Trial Balance"}
            </span>
          </div>
          <div
            className={cn(
              "mt-2 text-2xl font-mono font-bold",
              initialTrialBalance ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {initialTrialBalance ? `Δ ${formatKsh(initialTrialBalance.delta)}` : "Unavailable"}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {initialTrialBalance ? "trial balance delta" : "live trial balance not available"}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
          <span className="text-[11px] font-mono tracking-wider text-muted-foreground uppercase">
            Total Debits
          </span>
          <div
            className={cn(
              "mt-2 text-2xl font-mono font-bold",
              initialTrialBalance ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {initialTrialBalance ? formatKsh(initialTrialBalance.debits) : "—"}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">sum of debit balances</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
          <span className="text-[11px] font-mono tracking-wider text-muted-foreground uppercase">
            Total Credits
          </span>
          <div
            className={cn(
              "mt-2 text-2xl font-mono font-bold",
              initialTrialBalance ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {initialTrialBalance ? formatKsh(initialTrialBalance.credits) : "—"}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">sum of credit balances</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
          <span className="text-[11px] font-mono tracking-wider text-muted-foreground uppercase">
            Active COA Accounts
          </span>
          <div className="mt-2 text-2xl font-mono font-bold text-amber-500">{allAccounts.length}</div>
          <p className="mt-1 text-xs text-muted-foreground">posting-enabled accounts</p>
        </div>
      </div>

      {/* Two-pane grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Chart of Accounts */}
        <div className="lg:col-span-4">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <p className="text-[11px] font-mono tracking-wider text-muted-foreground uppercase">
                  Chart of Accounts
                </p>
                <p className="mt-1 text-2xl font-serif font-semibold text-foreground">GAAP tree.</p>
              </div>
              <span className="text-xs text-muted-foreground">{categoryKeys.length} categories</span>
            </div>

            <div className="mt-4 max-h-[600px] overflow-y-auto space-y-3">
              {(categoryKeys.length > 0 ? categoryKeys : DEFAULT_CATEGORY_ORDER).map((key) => {
                const nodes = initialTree[key] ?? [];
                const isOpen = openCategories[key] ?? true;
                return (
                  <div
                    key={key}
                    className={cn("rounded-xl border border-border bg-muted/40 p-2.5", !isOpen && "pb-1.5")}
                  >
                    <button
                      className="flex w-full items-center justify-between gap-2 text-left"
                      onClick={() =>
                        setOpenCategories((prev) => ({ ...prev, [key]: !(prev[key] ?? true) }))
                      }
                    >
                      <span className="flex items-center gap-1.5">
                        {isOpen ? (
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                        <span className="text-[11px] font-mono tracking-wider text-muted-foreground uppercase">
                          {key}
                        </span>
                      </span>
                      <span className="font-mono text-xs tabular-nums text-muted-foreground">
                        {categoryCounts[key] ?? 0}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="mt-2 space-y-0.5">
                        {nodes.map((node) => (
                          <AccountTreeRow
                            key={node.code}
                            node={node}
                            depth={1}
                            selectedCode={selectedCode}
                            getBalance={getBalance}
                            onSelect={handleSelect}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Postings */}
        <div className="lg:col-span-8">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
            <div className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-mono tracking-wider text-muted-foreground uppercase">
                  Postings
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <h2 className="text-2xl font-serif font-semibold text-foreground">Ledger entries.</h2>
                  {selectedCode && (
                    <button
                      onClick={() => handleSelect(selectedCode)}
                      className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1 text-[11px] font-mono font-semibold text-amber-500"
                    >
                      {selectedCode}
                      <FilterX className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="h-8 rounded-lg border border-input bg-muted px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <span className="text-xs text-muted-foreground">to</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="h-8 rounded-lg border border-input bg-muted px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <button
                  onClick={() => {
                    setFromDate("");
                    setToDate("");
                  }}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-muted px-2.5 text-xs text-muted-foreground transition hover:text-foreground"
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
                  Reset
                </button>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-[11px] font-mono tracking-wider text-muted-foreground uppercase">
                    <th className="py-3 pr-3">Date</th>
                    <th className="py-3 pr-3">Account</th>
                    <th className="py-3 pr-3">Source</th>
                    <th className="py-3 pr-3 text-right">Amount</th>
                    <th className="py-3 pr-3">Service</th>
                    <th className="py-3 text-right">Dimensions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {postings.content.length > 0 ? (
                    postings.content.map((p) => {
                      const negative = p.amount < 0;
                      return (
                        <tr key={p.id} className="transition hover:bg-muted/40">
                          <td className="py-3 pr-3 font-mono text-muted-foreground">
                            {p.occurredAt.replace("T", " ").slice(0, 16)}
                          </td>
                          <td className="py-3 pr-3 font-mono font-semibold text-amber-500">
                            {p.accountCode}
                          </td>
                          <td className="py-3 pr-3 text-muted-foreground">{p.sourceType}</td>
                          <td
                            className={cn(
                              "py-3 pr-3 text-right font-mono font-bold tabular-nums",
                              negative ? "text-emerald-400" : "text-foreground"
                            )}
                          >
                            {negative ? "-Ksh " : "+Ksh "}
                            {Math.abs(p.amount).toLocaleString()}
                          </td>
                          <td className="py-3 pr-3">
                            <span className={cn("rounded-full bg-muted px-2 py-0.5", "text-[10px]")}>
                              {p.serviceType || "—"}
                            </span>
                          </td>
                          <td className="py-3 text-right font-mono text-[11px] text-muted-foreground">
                            {p.companyId ?? "—"} · Rtr: {p.routerId ?? "—"}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                        {isLoading ? "Loading postings…" : "No postings recorded for this filter."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
              Showing {postings.content.length} of {postings.totalElements} records
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountTreeRow({
  node,
  depth,
  selectedCode,
  getBalance,
  onSelect,
}: {
  node: ChartOfAccountNode;
  depth: number;
  selectedCode: string | null;
  getBalance: (code: string) => number;
  onSelect: (code: string) => void;
}) {
  const children = node.children ?? [];
  return (
    <div>
      <button
        onClick={() => onSelect(node.code)}
        style={{ paddingLeft: `${depth * 12}px` }}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left transition-colors",
          selectedCode === node.code
            ? "bg-amber-500 text-black font-bold"
            : "hover:bg-muted/60",
          !node.isActive && "opacity-50"
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          {children.length > 0 ? (
            <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
          ) : (
            <span className="h-3 w-3 shrink-0" />
          )}
          <span className="truncate font-mono text-xs">{node.code}</span>
          <span className="truncate">{node.name}</span>
        </span>
        <span
          className={cn(
            "font-mono text-xs tabular-nums",
            selectedCode === node.code ? "text-black" : "text-muted-foreground"
          )}
        >
          {getBalance(node.code).toLocaleString()}
        </span>
      </button>
      {children.map((child) => (
        <AccountTreeRow
          key={child.code}
          node={child}
          depth={depth + 1}
          selectedCode={selectedCode}
          getBalance={getBalance}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}