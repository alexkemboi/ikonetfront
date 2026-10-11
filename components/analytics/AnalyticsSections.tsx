import Link from "next/link";
import {
  getAnalyticsNetwork,
  getAnalyticsRevenue,
  getAnalyticsRouters,
  getAnalyticsSubscribers,
  getAnalyticsSummary,
  getAnalyticsTargets,
} from "@/actions/analytics";
import { Amount } from "@/components/analytics/AmountsVisibility";
import { BarList } from "@/components/analytics/BarList";
import { HeatmapGrid } from "@/components/analytics/HeatmapGrid";
import { KpiRow } from "@/components/analytics/KpiRow";
import { CountMixPanel, MoneyMixPanel } from "@/components/analytics/MixPanel";
import { PanelBody, PanelCard, PanelNote, SectionError } from "@/components/analytics/PanelCard";
import { RankingPanel } from "@/components/analytics/RankingPanels";
import { TargetCards } from "@/components/analytics/TargetCards";
import { BytesTrendBody, CountTrendBody, DeltaBadge, PaymentsTrendBody } from "@/components/analytics/TrendPanels";
import { analyticsHref, type AnalyticsFilters } from "@/lib/analytics/filters";
import { dateRangeLabel, formatCount, formatDecimal, formatDuration, periodLabel } from "@/lib/analytics/format";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/utils/formatBytes";
import type { AnalyticsInterval, AnalyticsService } from "@/lib/types/analytics";

/*
 * Each section is its own async server component under its own Suspense boundary: it
 * loads, fails and re-loads without touching the others. Panel order and widths follow
 * the reference layout (two columns, the named panels spanning both).
 */

const grid = "grid grid-cols-1 gap-4 lg:grid-cols-2";
const wide = "lg:col-span-2";

function Segmented<T extends string>({
  label,
  options,
  selected,
  href,
}: {
  label: string;
  options: Array<{ value: T; label: string }>;
  selected: T;
  href: (value: T) => string;
}) {
  return (
    <nav aria-label={label} className="flex gap-0.5 rounded-md border border-border p-0.5">
      {options.map((option) => (
        <Link
          key={option.value}
          href={href(option.value)}
          scroll={false}
          aria-current={option.value === selected ? "true" : undefined}
          className={cn(
            "rounded px-2.5 py-1 text-xs font-medium transition",
            option.value === selected ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
        >
          {option.label}
        </Link>
      ))}
    </nav>
  );
}

// ------------------------------------------------------------------ summary

export async function SummarySection({ filters }: { filters: AnalyticsFilters }) {
  const result = await getAnalyticsSummary(filters);
  if (!result.success) return <SectionError message={result.message} requestId={result.requestId} />;
  const { context, kpis, paymentsTrend } = result.data;
  const period = periodLabel(context);
  const updated = new Date(context.generatedAt).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: context.timezone,
  });
  const serviceOptions: Array<{ value: AnalyticsService; label: string }> = [
    { value: "ALL", label: "All" },
    { value: "HOTSPOT", label: "Hotspot" },
    { value: "PPPOE", label: "PPPoE" },
  ];
  const intervalOptions: Array<{ value: Exclude<AnalyticsInterval, "HOUR">; label: string }> = [
    { value: "DAY", label: "Day" },
    { value: "WEEK", label: "Week" },
    { value: "MONTH", label: "Month" },
  ];

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        {context.routerName ?? "All MikroTik routers"} · {period}
        {context.period !== "CUSTOM" && <> · {dateRangeLabel(context.from, context.to)}</>} ({context.timezone}) · Updated {updated}
      </p>
      <KpiRow kpis={kpis} period={period} />

      <PanelCard
        title="Payments trend"
        period={period}
        helper={`Compared with ${dateRangeLabel(context.previousFrom, context.previousTo)}. Expenses show on All; Hotspot and PPPoE filter the trend by service.`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {paymentsTrend.data && <DeltaBadge deltaPercent={paymentsTrend.data.deltaPercent} comparison={paymentsTrend.data.comparison} />}
            <Segmented
              label="Service filter"
              options={serviceOptions}
              selected={context.service}
              href={(service) => analyticsHref({ ...filters, service })}
            />
            {context.interval !== "HOUR" && (
              <Segmented
                label="Bar size"
                options={intervalOptions}
                selected={context.interval}
                href={(interval) => analyticsHref({ ...filters, interval })}
              />
            )}
          </div>
        }
      >
        <PanelBody panel={paymentsTrend}>{(trend) => <PaymentsTrendBody trend={trend} />}</PanelBody>
      </PanelCard>
    </div>
  );
}

// ------------------------------------------------------------------ targets

export async function TargetsSection({ filters }: { filters: AnalyticsFilters }) {
  const result = await getAnalyticsTargets(filters.routerId);
  if (!result.success) return <SectionError message={result.message} requestId={result.requestId} />;
  return (
    <TargetCards
      targets={result.data.targets}
      scopeLabel={result.data.context.routerName ?? "every router"}
      routerId={filters.routerId}
    />
  );
}

// ------------------------------------------------------------------ revenue

export async function RevenueSection({ filters }: { filters: AnalyticsFilters }) {
  const result = await getAnalyticsRevenue(filters);
  if (!result.success) return <SectionError message={result.message} requestId={result.requestId} />;
  const data = result.data;
  const period = periodLabel(data.context);

  return (
    <div className={grid}>
      <PanelCard title="Top packages" period={period} helper="Packages by money received">
        <PanelBody panel={data.topPackages}>
          {(ranking) => <RankingPanel kind="packages" rows={ranking.rows} filters={filters} period={period} />}
        </PanelBody>
      </PanelCard>
      <PanelCard title="Top customers" period={period} helper="Highest-paying subscribers — your value rank list">
        <PanelBody panel={data.topCustomers}>
          {(ranking) => <RankingPanel kind="customers" rows={ranking.rows} filters={filters} period={period} />}
        </PanelBody>
      </PanelCard>

      <PanelCard title="Revenue mix" period={period} helper="Ledger revenue by service">
        <PanelBody panel={data.revenueMix}>{(mix) => <MoneyMixPanel mix={mix} unit={{ one: "posting", many: "postings" }} />}</PanelBody>
      </PanelCard>
      <PanelCard title="Payment methods" period={period} helper="Money received, by how it was paid">
        <PanelBody panel={data.paymentMethods}>{(mix) => <MoneyMixPanel mix={mix} unit={{ one: "payment", many: "payments" }} />}</PanelBody>
      </PanelCard>

      <PanelCard title="Failed M-Pesa payments" period={period} helper="M-Pesa prompts that did not end in a payment">
        <PanelBody panel={data.failedMpesa}>
          {(failed) => (
            <div>
              <p className="text-2xl font-semibold tabular-nums text-foreground">
                <Amount value={failed.notPaidAmount} currency={failed.currency} />
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {failed.promptCount === 0
                  ? "No M-Pesa prompts were sent in this period."
                  : `not paid · ${formatCount(failed.failedCount)} of ${formatCount(failed.promptCount)} prompts`}
              </p>
              {failed.outcomes.length > 0 && (
                <div className="mt-4">
                  <BarList
                    rows={failed.outcomes.map((outcome) => ({
                      key: outcome.code,
                      label: outcome.label,
                      value: outcome.count,
                      display: formatCount(outcome.count),
                    }))}
                  />
                </div>
              )}
            </div>
          )}
        </PanelBody>
      </PanelCard>
      <PanelCard title="When customers pay" period={period} helper="Payments by weekday and hour">
        <PanelBody panel={data.paymentTimes} isEmpty={(heat) => heat.total === 0} empty="No payments in this period.">
          {(heat) => <HeatmapGrid heatmap={heat} unit={{ one: "payment", many: "payments" }} />}
        </PanelBody>
      </PanelCard>
    </div>
  );
}

// -------------------------------------------------------------- subscribers

export async function SubscribersSection({ filters }: { filters: AnalyticsFilters }) {
  const result = await getAnalyticsSubscribers(filters);
  if (!result.success) return <SectionError message={result.message} requestId={result.requestId} />;
  const data = result.data;
  const period = periodLabel(data.context);

  return (
    <div className={grid}>
      <PanelCard
        className={wide}
        title="New subscribers"
        period={period}
        helper="PPPoE accounts opened, and hotspot customers seen for the first time"
        action={data.newSubscribers.data && <DeltaBadge deltaPercent={data.newSubscribers.data.deltaPercent} comparison={data.newSubscribers.data.comparison} />}
      >
        <PanelBody panel={data.newSubscribers}>{(trend) => <CountTrendBody trend={trend} unit="new" />}</PanelBody>
      </PanelCard>

      <PanelCard title="Subscribers by type" helper="Everyone counted under Lifecycle, by service">
        <PanelBody panel={data.byType} isEmpty={(b) => b.total === 0} empty="No subscribers yet.">
          {(breakdown) => <CountMixPanel breakdown={breakdown} />}
        </PanelBody>
      </PanelCard>
      <PanelCard title="Lifecycle" helper="Where subscribers stand right now; hotspot customers leave after 30 days expired">
        <PanelBody panel={data.lifecycle} isEmpty={(b) => b.total === 0} empty="No subscribers yet.">
          {(breakdown) => (
            <BarList
              rows={breakdown.rows.map((row) => ({ key: row.code, label: row.label, value: row.count, display: formatCount(row.count) }))}
            />
          )}
        </PanelBody>
      </PanelCard>

      <PanelCard className={wide} title="Expiring soon" helper="Active subscribers whose plan runs out within each horizon (each includes the one before)">
        <PanelBody panel={data.expiringSoon}>
          {(expiring) => (
            <BarList
              rows={[
                { key: "7", label: "Next 7 days", value: expiring.within7Days, display: formatCount(expiring.within7Days) },
                { key: "14", label: "Next 14 days", value: expiring.within14Days, display: formatCount(expiring.within14Days) },
                { key: "30", label: "Next 30 days", value: expiring.within30Days, display: formatCount(expiring.within30Days) },
              ]}
            />
          )}
        </PanelBody>
      </PanelCard>

      <PanelCard className={wide} title="Renewal rate" period={period} helper="Of the plans that ran out, how soon the customer paid again">
        <PanelBody panel={data.renewalRate} isEmpty={(r) => r.expiredPlans === 0} empty="No plans ran out in this period.">
          {(renewal) => (
            <div>
              <p className="text-2xl font-semibold tabular-nums text-foreground">{formatDecimal(renewal.ratePercent)}%</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatCount(renewal.renewedPlans)} of {formatCount(renewal.expiredPlans)} plans were followed by another purchase
              </p>
              <div className="mt-4">
                <BarList rows={renewal.buckets.map((b) => ({ key: b.code, label: b.label, value: b.count, display: formatCount(b.count) }))} />
              </div>
            </div>
          )}
        </PanelBody>
      </PanelCard>

      <PanelCard className={wide} title="Repeat buyers" period={period} helper="Customers who paid more than once. A hotspot customer is their phone number.">
        <PanelBody panel={data.repeatBuyers} isEmpty={(r) => r.payingCustomers === 0} empty="No customer paid in this period.">
          {(repeat) => (
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: "Bought more than once", value: `${formatDecimal(repeat.repeatPercent)}%`, detail: `of ${formatCount(repeat.payingCustomers)} paying customers` },
                { label: "Repeat customers", value: formatCount(repeat.repeatCustomers), detail: "paid at least twice" },
                { label: "Purchases per customer", value: formatDecimal(repeat.purchasesPerCustomer), detail: "on average" },
                { label: "Spend per customer", value: <Amount value={repeat.spendPerCustomer} currency={repeat.currency} />, detail: "on average" },
              ].map((item) => (
                <div key={item.label}>
                  <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">{item.label}</dt>
                  <dd className="mt-1 text-xl font-semibold tabular-nums text-foreground">{item.value}</dd>
                  <dd className="text-xs text-muted-foreground">{item.detail}</dd>
                </div>
              ))}
            </dl>
          )}
        </PanelBody>
      </PanelCard>
    </div>
  );
}

// ------------------------------------------------------------------ network

function changeNote(deltaPercent: string | null, previousBytes: number | null): string | undefined {
  if (previousBytes == null) return undefined;
  if (deltaPercent == null) return "new this period";
  const value = Number.parseFloat(deltaPercent);
  return `${value < 0 ? "▼" : "▲"} ${Math.abs(value).toLocaleString("en-US", { maximumFractionDigits: 1 })}%`;
}

export async function NetworkSection({ filters }: { filters: AnalyticsFilters }) {
  const result = await getAnalyticsNetwork(filters);
  if (!result.success) return <SectionError message={result.message} requestId={result.requestId} />;
  const data = result.data;
  const period = periodLabel(data.context);

  return (
    <div className={grid}>
      <PanelCard className={wide} title="Active sessions" period={period} helper="Sessions open at any time in each bar, against the previous period">
        <PanelBody
          panel={data.activeSessions}
          isEmpty={(trend) => trend.currentTotal === 0 && trend.previousTotal === 0}
          empty="No sessions in this period."
        >
          {(trend) => <CountTrendBody trend={trend} unit="sessions" />}
        </PanelBody>
      </PanelCard>

      <PanelCard
        className={wide}
        title="Data usage"
        period={period}
        helper="Traffic of the sessions that started in each bar"
        action={data.dataUsage.data && <DeltaBadge deltaPercent={data.dataUsage.data.deltaPercent} comparison={data.dataUsage.data.comparison} />}
      >
        <PanelBody panel={data.dataUsage} isEmpty={(t) => t.currentBytes === 0 && t.previousBytes === 0} empty="No traffic in this period.">
          {(trend) => <BytesTrendBody trend={trend} />}
        </PanelBody>
      </PanelCard>

      <PanelCard title="Upload vs download" period={period}>
        <PanelBody panel={data.uploadDownload} isEmpty={(u) => u.totalBytes === 0} empty="No traffic in this period.">
          {(usage) => {
            const down = usage.totalBytes > 0 ? (usage.downloadBytes / usage.totalBytes) * 100 : 0;
            return (
              <div>
                <p className="text-2xl font-semibold tabular-nums text-foreground">{formatBytes(usage.totalBytes)}</p>
                <p className="mt-1 text-xs text-muted-foreground">transferred in total</p>
                <div className="mt-4 flex h-2.5 w-full gap-[2px] overflow-hidden rounded-full" role="img" aria-label={`Download ${down.toFixed(0)}%, upload ${(100 - down).toFixed(0)}%`}>
                  <div style={{ width: `${down}%`, background: "var(--viz-1)" }} />
                  <div className="flex-1" style={{ background: "var(--viz-2)" }} />
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="size-2.5 rounded-sm" style={{ background: "var(--viz-1)" }} />
                      Download
                    </dt>
                    <dd className="mt-0.5 font-semibold tabular-nums">{formatBytes(usage.downloadBytes)}</dd>
                  </div>
                  <div>
                    <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="size-2.5 rounded-sm" style={{ background: "var(--viz-2)" }} />
                      Upload
                    </dt>
                    <dd className="mt-0.5 font-semibold tabular-nums">{formatBytes(usage.uploadBytes)}</dd>
                  </div>
                </dl>
              </div>
            );
          }}
        </PanelBody>
      </PanelCard>

      <PanelCard title="Usage by plan" period={period} helper="Traffic by the plan each session ran on">
        <PanelBody panel={data.usageByPlan} isEmpty={(r) => r.rows.length === 0} empty="No per-plan traffic recorded.">
          {(ranking) => (
            <BarList
              ordered
              rows={ranking.rows.map((row) => ({
                key: `${row.rank}-${row.planId}`,
                label: row.planName,
                detail: changeNote(row.deltaPercent, row.previousBytes),
                value: row.bytes,
                display: formatBytes(row.bytes),
              }))}
            />
          )}
        </PanelBody>
      </PanelCard>

      <PanelCard className={wide} title="Top talkers" period={period} helper="The heaviest users; hotspot users are shown by a masked number or device">
        <PanelBody panel={data.topTalkers} isEmpty={(r) => r.rows.length === 0} empty="No session traffic in this period.">
          {(ranking) => (
            <BarList
              ordered
              rows={ranking.rows.map((row) => ({
                key: row.userId,
                label: row.userName,
                detail: [row.service === "PPPOE" ? "PPPoE" : "Hotspot", row.routerName].filter(Boolean).join(" · "),
                value: row.bytes,
                display: formatBytes(row.bytes),
              }))}
            />
          )}
        </PanelBody>
      </PanelCard>

      <PanelCard className={wide} title="Traffic heatmap" period={period} helper="Distinct users by weekday and hour">
        <PanelBody panel={data.trafficHeatmap} isEmpty={(heat) => !heat.sufficient} empty="Not enough traffic for a heatmap yet.">
          {(heat) => <HeatmapGrid heatmap={heat} unit={{ one: "user", many: "users" }} />}
        </PanelBody>
      </PanelCard>

      <PanelCard className={wide} title="Router downtime" period={period} helper="Time each router was offline, from its outage records">
        <PanelBody panel={data.routerDowntime} isEmpty={(d) => d.routers.length === 0} empty="No monitored routers in this scope.">
          {(downtime) =>
            downtime.totalSeconds === 0 ? (
              <PanelNote>No outage was recorded for {formatCount(downtime.routers.length)} monitored router{downtime.routers.length === 1 ? "" : "s"} in this period.</PanelNote>
            ) : (
              <BarList
                rows={downtime.routers.map((row) => ({
                  key: String(row.routerIdxno),
                  label: row.routerName,
                  detail: `${formatCount(row.outageCount)} outage${row.outageCount === 1 ? "" : "s"}${row.ongoing ? " · offline now" : ""}`,
                  value: row.downtimeSeconds,
                  display: row.downtimeSeconds === 0 ? "None" : formatDuration(row.downtimeSeconds),
                }))}
              />
            )
          }
        </PanelBody>
      </PanelCard>
    </div>
  );
}

// ------------------------------------------------------------------ routers

const STATUS_STYLE: Record<string, string> = {
  ONLINE: "bg-emerald-500",
  OFFLINE: "bg-rose-500",
  UNKNOWN: "bg-zinc-400",
};

export async function RoutersSection({ filters }: { filters: AnalyticsFilters }) {
  const result = await getAnalyticsRouters(filters);
  if (!result.success) return <SectionError message={result.message} requestId={result.requestId} />;
  const { context, performance } = result.data;
  const table = performance.status === "AVAILABLE" ? performance.data : null;

  return (
    <PanelCard title="MikroTik performance" period={periodLabel(context)} helper="Revenue, sessions, and data per router">
      {/* the seven columns stay in place while loading has failed or nothing qualifies */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
              <th scope="col" className="py-2 pr-3 font-medium">Router</th>
              <th scope="col" className="px-3 py-2 font-medium">Status</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Subs</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Revenue</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Sessions</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Data</th>
              <th scope="col" className="w-40 py-2 pl-3 font-medium">Share</th>
            </tr>
          </thead>
          <tbody>
            {table?.rows.map((row) => {
              const share = Math.min(100, Math.max(0, Number.parseFloat(row.revenueSharePercent) || 0));
              return (
                <tr key={row.routerId} className="border-b border-border last:border-0">
                  <th scope="row" className="py-2.5 pr-3 font-medium text-foreground">{row.routerName}</th>
                  <td className="px-3 py-2.5">
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className={cn("size-2 rounded-full", STATUS_STYLE[row.status])} aria-hidden="true" />
                      {row.status.charAt(0) + row.status.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{formatCount(row.subscriberCount)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums"><Amount value={row.revenueAmount} currency={row.currency} /></td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{formatCount(row.sessionCount)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{formatBytes(row.dataTransferredBytes)}</td>
                  <td className="py-2.5 pl-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div className="h-1.5 rounded-full" style={{ width: `${share}%`, background: "var(--viz-1)" }} />
                      </div>
                      <span className="w-12 text-right text-xs tabular-nums text-muted-foreground">{formatDecimal(row.revenueSharePercent)}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!table ? (
        <div className="mt-4"><PanelNote tone="error">{performance.message ?? "Router figures could not be loaded."}</PanelNote></div>
      ) : table.rows.length === 0 ? (
        <div className="mt-4"><PanelNote>No routers in this scope.</PanelNote></div>
      ) : (
        table.unattributedRevenue != null && (
          <p className="mt-3 border-t border-border pt-3 text-right text-xs text-muted-foreground">
            Not attributed to a router: <Amount value={table.unattributedRevenue} currency={table.currency} />
          </p>
        )
      )}
    </PanelCard>
  );
}
