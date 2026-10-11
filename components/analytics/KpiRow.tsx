import type { ReactNode } from "react";
import { Amount, AmountsToggle } from "@/components/analytics/AmountsVisibility";
import { formatCount, formatDuration } from "@/lib/analytics/format";
import { formatBytes } from "@/lib/utils/formatBytes";
import type { AnalyticsKpis, Panel } from "@/lib/types/analytics";

function Kpi<T>({
  label,
  panel,
  money = false,
  value,
  detail,
}: {
  label: string;
  panel: Panel<T>;
  money?: boolean;
  value: (data: T) => ReactNode;
  detail: (data: T) => ReactNode;
}) {
  const data = panel.status === "AVAILABLE" ? panel.data : null;
  return (
    <div className="min-w-0 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        {money && <AmountsToggle />}
      </div>
      <p className="mt-2 truncate text-2xl font-semibold tabular-nums text-foreground">{data ? value(data) : "—"}</p>
      <p className="mt-1 truncate text-xs text-muted-foreground">{data ? detail(data) : "Not available right now"}</p>
    </div>
  );
}

/** The eight headline figures, in a fixed order. A figure that could not be read shows a dash, never a zero. */
export function KpiRow({ kpis, period }: { kpis: AnalyticsKpis; period: string }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Kpi
        label="Active subscribers"
        panel={kpis.activeSubscribers}
        value={(d) => formatCount(d.count)}
        detail={(d) => `+${formatCount(d.newInPeriod)} new · ${period}`}
      />
      <Kpi
        label="Revenue"
        panel={kpis.revenue}
        money
        value={(d) => <Amount value={d.amount} currency={d.currency} />}
        detail={() => period}
      />
      <Kpi
        label="ARPU"
        panel={kpis.arpu}
        money
        value={(d) => (d.amount == null ? "—" : <Amount value={d.amount} currency={d.currency} />)}
        detail={(d) =>
          d.amount == null ? `No paying subscriber in ${d.windowDays} days` : `Last ${d.windowDays} days, per paying subscriber`
        }
      />
      <Kpi
        label="Sessions"
        panel={kpis.sessions}
        value={(d) => formatCount(d.count)}
        detail={(d) => (d.averageDurationSeconds == null ? "No duration reported" : `Average ${formatDuration(d.averageDurationSeconds)}`)}
      />
      <Kpi
        label="Data transferred"
        panel={kpis.dataUsage}
        value={(d) => formatBytes(d.totalBytes)}
        detail={(d) => `${formatBytes(d.downloadBytes)} down`}
      />
      <Kpi
        label="Online now"
        panel={kpis.onlineNow}
        value={(d) => formatCount(d.openSessionCount)}
        detail={() => "Open sessions"}
      />
      <Kpi label="Payments" panel={kpis.payments} value={(d) => formatCount(d.count)} detail={() => period} />
      <Kpi
        label="Overdue"
        panel={kpis.overdue}
        money
        value={(d) => <Amount value={d.amount} currency={d.currency} />}
        detail={(d) => `${formatCount(d.invoiceCount)} ${d.invoiceCount === 1 ? "invoice" : "invoices"} past due`}
      />
    </div>
  );
}
