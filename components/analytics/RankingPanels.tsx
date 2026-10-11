"use client";

import { useEffect, useState } from "react";
import { getTopCustomers, getTopPackages } from "@/actions/analytics";
import { Amount } from "@/components/analytics/AmountsVisibility";
import { PanelNote } from "@/components/analytics/PanelCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { AnalyticsFilters } from "@/lib/analytics/filters";
import { formatCount, formatDecimal } from "@/lib/analytics/format";
import type { RankedCustomer, RankedPackage } from "@/lib/types/analytics";

type Kind = "packages" | "customers";
type Row = RankedPackage | RankedCustomer;

function isPackage(row: Row): row is RankedPackage {
  return "packageName" in row;
}

function RankedRows({ rows }: { rows: Row[] }) {
  return (
    <ol className="divide-y divide-border">
      {rows.map((row) => (
        <li key={`${row.rank}-${isPackage(row) ? row.packageId : row.customerId}`} className="flex items-center justify-between gap-3 py-2.5 text-sm">
          <span className="flex min-w-0 items-baseline gap-2.5">
            <span className="w-6 shrink-0 text-xs tabular-nums text-muted-foreground">{row.rank}</span>
            <span className="min-w-0">
              <span className="block truncate text-foreground">{isPackage(row) ? row.packageName : row.customerName}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {isPackage(row)
                  ? `${formatCount(row.subscribers)} ${row.subscribers === 1 ? "subscriber" : "subscribers"} · ${formatDecimal(row.sharePercent)}%`
                  : `${formatCount(row.paymentCount)} ${row.paymentCount === 1 ? "payment" : "payments"}`}
              </span>
            </span>
          </span>
          <span className="shrink-0 font-medium tabular-nums text-foreground">
            <Amount value={row.amount} currency={row.currency} />
          </span>
        </li>
      ))}
    </ol>
  );
}

/** The six leading rows, with the full ranking (up to 50) one click away. */
export function RankingPanel({
  kind,
  rows,
  filters,
  period,
}: {
  kind: Kind;
  rows: Row[];
  filters: AnalyticsFilters;
  period: string;
}) {
  const [open, setOpen] = useState(false);
  if (rows.length === 0) {
    return <PanelNote>{kind === "packages" ? "No package sold in this period." : "No customer paid in this period."}</PanelNote>;
  }
  return (
    <>
      <RankedRows rows={rows} />
      <div className="mt-3">
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
          View top 50
        </Button>
      </div>
      {open && <Top50Dialog kind={kind} filters={filters} period={period} onClose={() => setOpen(false)} />}
    </>
  );
}

function Top50Dialog({ kind, filters, period, onClose }: { kind: Kind; filters: AnalyticsFilters; period: string; onClose: () => void }) {
  const [state, setState] = useState<{ rows: Row[] } | { error: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (kind === "packages" ? getTopPackages(filters) : getTopCustomers(filters)).then((result) => {
      if (cancelled) return;
      setState(result.success ? { rows: result.data.rows } : { error: result.message });
    });
    return () => {
      cancelled = true;
    };
  }, [kind, filters]);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Top {kind} · {period}
          </DialogTitle>
          <DialogDescription>Up to 50 ranked results for the selected period and router scope.</DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto pr-1">
          {state === null ? (
            <p role="status" className="py-8 text-center text-sm text-muted-foreground">
              Loading top 50…
            </p>
          ) : "error" in state ? (
            <PanelNote tone="error">{state.error}</PanelNote>
          ) : state.rows.length === 0 ? (
            <PanelNote>Nothing to rank in this period.</PanelNote>
          ) : (
            <RankedRows rows={state.rows} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
