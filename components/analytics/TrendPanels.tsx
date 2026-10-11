"use client";

import { Amount } from "@/components/analytics/AmountsVisibility";
import { ComparisonChart } from "@/components/analytics/ComparisonChart";
import { formatCompact, formatCount, formatDelta, formatMoney } from "@/lib/analytics/format";
import { formatBytes } from "@/lib/utils/formatBytes";
import type { BytesTrend, Comparison, CountTrend, PaymentsTrend } from "@/lib/types/analytics";

function bucketTitle(iso: string | null, interval: string): string | undefined {
  if (!iso) return undefined;
  // the bucket's own wall-clock date and time, whatever zone this browser is in
  const [date, time] = iso.split("T");
  const day = new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  if (interval === "HOUR") return `${day}, ${time.slice(0, 5)}`;
  if (interval === "WEEK") return `Week of ${day}`;
  if (interval === "MONTH") return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  return day;
}

/** "▲ 0.2%" in the colour of its direction, with words for screen readers. Nothing when there is no comparison. */
export function DeltaBadge({ deltaPercent, comparison }: { deltaPercent: string | null; comparison: Comparison }) {
  const text = formatDelta(deltaPercent, comparison);
  if (!text) return null;
  const tone = comparison === "DOWN" ? "text-rose-500" : comparison === "UP" ? "text-emerald-500" : "text-muted-foreground";
  return (
    <span className={`text-xs font-medium tabular-nums ${tone}`}>
      {text}
      <span className="sr-only"> {comparison === "DOWN" ? "down" : comparison === "UP" ? "up" : "no change"} against the previous period</span>
    </span>
  );
}

function Totals({ items }: { items: Array<{ label: string; value: React.ReactNode }> }) {
  return (
    <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 sm:grid-cols-4">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">{item.label}</dt>
          <dd className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function PaymentsTrendBody({ trend }: { trend: PaymentsTrend }) {
  const money = (value: string | null) => <Amount value={value} currency={trend.currency} />;
  return (
    <>
      <ComparisonChart
        money
        height={260}
        extraLabel={trend.expensesIncluded ? "Expenses" : undefined}
        format={(value) => formatMoney(value.toFixed(2), trend.currency)}
        formatAxis={formatCompact}
        points={trend.points.map((point) => ({
          label: point.label,
          title: bucketTitle(point.bucketStart, trend.interval),
          previousTitle: bucketTitle(point.previousBucketStart, trend.interval),
          current: Number.parseFloat(point.currentAmount) || 0,
          previous: Number.parseFloat(point.previousAmount) || 0,
          extra: point.expenseAmount == null ? undefined : Number.parseFloat(point.expenseAmount) || 0,
        }))}
      />
      <Totals
        items={[
          { label: "This period", value: money(trend.currentTotal) },
          ...(trend.expensesIncluded
            ? [
                { label: "Expenses", value: money(trend.expenseTotal) },
                { label: "Net", value: money(trend.netTotal) },
              ]
            : []),
          { label: "Prev", value: money(trend.previousTotal) },
        ]}
      />
    </>
  );
}

export function CountTrendBody({ trend, unit }: { trend: CountTrend; unit: string }) {
  return (
    <>
      <ComparisonChart
        format={(value) => `${formatCount(value)} ${unit}`}
        formatAxis={formatCompact}
        points={trend.points.map((point) => ({
          label: point.label,
          title: bucketTitle(point.bucketStart, trend.interval),
          previousTitle: bucketTitle(point.previousBucketStart, trend.interval),
          current: point.current,
          previous: point.previous,
        }))}
      />
      <Totals
        items={
          trend.peak != null
            ? [{ label: "Peak at once", value: formatCount(trend.peak) }]
            : [
                { label: "This period", value: formatCount(trend.currentTotal) },
                { label: "Prev", value: formatCount(trend.previousTotal) },
              ]
        }
      />
    </>
  );
}

export function BytesTrendBody({ trend }: { trend: BytesTrend }) {
  return (
    <>
      <ComparisonChart
        format={(value) => formatBytes(value)}
        formatAxis={(value) => formatBytes(value)}
        points={trend.points.map((point) => ({
          label: point.label,
          title: bucketTitle(point.bucketStart, trend.interval),
          previousTitle: bucketTitle(point.previousBucketStart, trend.interval),
          current: point.currentBytes,
          previous: point.previousBytes,
        }))}
      />
      <Totals
        items={[
          { label: "This period", value: formatBytes(trend.currentBytes) },
          { label: "Prev", value: formatBytes(trend.previousBytes) },
        ]}
      />
    </>
  );
}
