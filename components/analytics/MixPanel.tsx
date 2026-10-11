"use client";

import { Amount, useAmountsHidden } from "@/components/analytics/AmountsVisibility";
import { Donut } from "@/components/analytics/Donut";
import { formatCount, formatDecimal, formatMoney } from "@/lib/analytics/format";
import type { Breakdown, Mix } from "@/lib/types/analytics";

/** A colour belongs to what it names, on every chart: Hotspot is always slot 1, PPPoE slot 2, "Other" is neutral. */
const COLORS: Record<string, string> = {
  HOTSPOT: "var(--viz-1)",
  PPPOE: "var(--viz-2)",
  TV: "var(--viz-3)",
  MOBILE_MONEY: "var(--viz-1)",
  VOUCHER: "var(--viz-2)",
  CASH: "var(--viz-3)",
  BANK: "var(--viz-4)",
  OTHER: "var(--viz-other)",
};

function Swatch({ code }: { code: string }) {
  return <span className="size-2.5 shrink-0 rounded-sm" style={{ background: COLORS[code] ?? "var(--viz-other)" }} />;
}

/** Money split into a few categories: a donut with the total, and every category listed with its figures. */
export function MoneyMixPanel({ mix, unit }: { mix: Mix; unit: { one: string; many: string } }) {
  const hidden = useAmountsHidden();
  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
      <Donut
        caption="Total"
        center={<Amount value={mix.totalAmount} currency={mix.currency} />}
        slices={mix.rows.map((row) => ({
          code: row.code,
          label: row.label,
          value: Math.max(0, Number.parseFloat(row.amount) || 0),
          color: COLORS[row.code] ?? "var(--viz-other)",
          display: hidden ? `${formatDecimal(row.sharePercent)}%` : `${formatMoney(row.amount, mix.currency)} · ${formatDecimal(row.sharePercent)}%`,
        }))}
      />
      <ul className="w-full min-w-0 flex-1 divide-y divide-border">
        {mix.rows.map((row) => (
          <li key={row.code} className="flex items-center justify-between gap-3 py-2 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <Swatch code={row.code} />
              <span className="min-w-0">
                <span className="block truncate text-foreground">{row.label}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {formatDecimal(row.sharePercent)}% · {formatCount(row.count)} {row.count === 1 ? unit.one : unit.many}
                  {row.averageAmount != null && !hidden ? ` · avg ${formatMoney(row.averageAmount, mix.currency)}` : ""}
                </span>
              </span>
            </span>
            <span className="shrink-0 font-medium tabular-nums text-foreground">
              <Amount value={row.amount} currency={mix.currency} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Subscribers split by type. */
export function CountMixPanel({ breakdown }: { breakdown: Breakdown }) {
  const share = (count: number) => (breakdown.total > 0 ? `${((count / breakdown.total) * 100).toFixed(1)}%` : "0%");
  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
      <Donut
        caption="Total"
        center={formatCount(breakdown.total)}
        slices={breakdown.rows.map((row) => ({
          code: row.code,
          label: row.label,
          value: row.count,
          color: COLORS[row.code] ?? "var(--viz-other)",
          display: `${formatCount(row.count)} · ${share(row.count)}`,
        }))}
      />
      <ul className="w-full min-w-0 flex-1 divide-y divide-border">
        {breakdown.rows.map((row) => (
          <li key={row.code} className="flex items-center justify-between gap-3 py-2 text-sm">
            <span className="flex items-center gap-2">
              <Swatch code={row.code} />
              <span className="text-foreground">{row.label}</span>
              <span className="text-xs text-muted-foreground">{share(row.count)}</span>
            </span>
            <span className="font-medium tabular-nums text-foreground">{formatCount(row.count)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
