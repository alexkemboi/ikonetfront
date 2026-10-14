import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Download } from "lucide-react";
import { getAnalyticsRouterOptions } from "@/actions/analytics";
import { AmountsVisibilityProvider } from "@/components/analytics/AmountsVisibility";
import { AnalyticsFilterBar } from "@/components/analytics/AnalyticsFilterBar";
import {
  NetworkSection,
  RevenueSection,
  RoutersSection,
  SubscribersSection,
  SummarySection,
  TargetsSection,
} from "@/components/analytics/AnalyticsSections";
import { BackToTop } from "@/components/analytics/BackToTop";
import { SectionHeading, SectionSkeleton } from "@/components/analytics/PanelCard";
import { analyticsApiQuery, analyticsHref, parseAnalyticsFilters } from "@/lib/analytics/filters";
import { getPermissionForRoute } from "@/lib/data/nav";
import { LiveDataRefresh } from "@/providers/MonitoringHeartbeat";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Analytics | IBS Platform",
  description: "Revenue, subscribers and network analytics by period and router",
};

/** Online-now and session figures move by the minute; the rest by the hour. Five minutes keeps the page honest without re-running every panel constantly. */
const REFRESH_MS = 5 * 60_000;

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const pagePerms = await getPermissionForRoute("/analytics");
  if (!pagePerms.canView) redirect("/dashboard");

  const filters = parseAnalyticsFilters(await searchParams);
  const routers = await getAnalyticsRouterOptions();
  // the last day a report can end on; the backend re-checks against the company's own time zone
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Nairobi" }).format(new Date());

  // a section re-suspends only when a filter it depends on changes
  const scope = analyticsApiQuery(filters);
  const charted = analyticsApiQuery(filters, { interval: true });
  const summaryKey = analyticsApiQuery(filters, { service: true, interval: true });

  return (
    <AmountsVisibilityProvider>
      <div id="analytics-top" className="analytics-viz p-4 text-foreground sm:p-6 lg:p-8">
        <LiveDataRefresh intervalMs={REFRESH_MS} />
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Insights — Analytics</span>
              <h1 className="text-3xl font-normal text-foreground">Your network.</h1>
            </div>
            {/* a plain link: the browser downloads the file, and a failed export shows the backend's reason */}
            <a
              href={`/api/analytics/export?${analyticsHref(filters).split("?")[1]}`}
              download
              className="inline-flex items-center gap-2 self-start rounded-lg border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground transition hover:bg-accent sm:self-auto"
            >
              <Download className="size-3.5" aria-hidden="true" />
              Export CSV
            </a>
          </div>

          <AnalyticsFilterBar filters={filters} routers={routers.success ? routers.data : null} today={today} />

          <Suspense key={`summary-${summaryKey}`} fallback={<SectionSkeleton label="summary" panels={["wide", "wide"]} />}>
            <SummarySection filters={filters} />
          </Suspense>

          <section aria-labelledby="analytics-targets" className="space-y-3">
            <SectionHeading id="analytics-targets">This month&apos;s targets</SectionHeading>
            <Suspense key={`targets-${filters.routerId ?? "all"}`} fallback={<SectionSkeleton label="targets" panels={["half", "half"]} />}>
              <TargetsSection filters={filters} />
            </Suspense>
          </section>

          <section aria-labelledby="analytics-revenue" className="space-y-3">
            <SectionHeading id="analytics-revenue">Revenue &amp; billing</SectionHeading>
            <Suspense key={`revenue-${scope}`} fallback={<SectionSkeleton label="revenue and billing" panels={["half", "half", "half", "half", "half", "half"]} />}>
              <RevenueSection filters={filters} />
            </Suspense>
          </section>

          <section aria-labelledby="analytics-subscribers" className="space-y-3">
            <SectionHeading id="analytics-subscribers">Subscribers</SectionHeading>
            <Suspense key={`subscribers-${charted}`} fallback={<SectionSkeleton label="subscribers" panels={["wide", "half", "half", "wide", "wide", "wide"]} />}>
              <SubscribersSection filters={filters} />
            </Suspense>
          </section>

          <section aria-labelledby="analytics-network" className="space-y-3">
            <SectionHeading id="analytics-network">Network</SectionHeading>
            <Suspense key={`network-${charted}`} fallback={<SectionSkeleton label="network" panels={["wide", "wide", "half", "half", "wide", "wide", "wide"]} />}>
              <NetworkSection filters={filters} />
            </Suspense>
          </section>

          <section aria-labelledby="analytics-mikrotik" className="space-y-3">
            <SectionHeading id="analytics-mikrotik">MikroTik</SectionHeading>
            <Suspense key={`routers-${scope}`} fallback={<SectionSkeleton label="router performance" panels={["wide"]} />}>
              <RoutersSection filters={filters} />
            </Suspense>
          </section>
        </div>
        <BackToTop />
      </div>
    </AmountsVisibilityProvider>
  );
}
