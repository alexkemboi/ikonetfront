import type { AnalyticsInterval, AnalyticsPeriod, AnalyticsService } from "@/lib/types/analytics";

/**
 * The analytics filters as the page URL carries them. The URL is the single source of
 * truth: a copied link reproduces the same report, and the backend echoes what it applied.
 */
export interface AnalyticsFilters {
  /** a preset, or CUSTOM when from is set */
  period: AnalyticsPeriod;
  from?: string;
  to?: string;
  routerId?: string;
  service: AnalyticsService;
  interval?: Exclude<AnalyticsInterval, "HOUR">;
}

export const PERIOD_OPTIONS: Array<{ value: Exclude<AnalyticsPeriod, "CUSTOM">; label: string; param: string }> = [
  { value: "DAILY", label: "Daily", param: "daily" },
  { value: "WEEKLY", label: "Weekly", param: "weekly" },
  { value: "MONTHLY", label: "Monthly", param: "monthly" },
  { value: "YEARLY", label: "Yearly", param: "yearly" },
  { value: "LAST_YEAR", label: "Last Year", param: "last_year" },
];

export const MAX_RANGE_DAYS = 366;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

type Raw = Record<string, string | string[] | undefined>;

function first(raw: Raw, key: string): string | undefined {
  const value = raw[key];
  const one = Array.isArray(value) ? value[0] : value;
  return one?.trim() || undefined;
}

/** Unknown or malformed values fall back to the default; the backend still validates the dates themselves. */
export function parseAnalyticsFilters(raw: Raw): AnalyticsFilters {
  const service = first(raw, "service")?.toUpperCase();
  const interval = first(raw, "interval")?.toUpperCase();
  const routerId = first(raw, "routerId");
  const from = first(raw, "from");
  const to = first(raw, "to");
  const period = first(raw, "period")?.toUpperCase();

  const filters: AnalyticsFilters = {
    period: "MONTHLY",
    service: service === "HOTSPOT" || service === "PPPOE" ? service : "ALL",
  };
  if (interval === "DAY" || interval === "WEEK" || interval === "MONTH") filters.interval = interval;
  if (routerId && /^\d+$/.test(routerId)) filters.routerId = routerId;

  if (from && ISO_DATE.test(from)) {
    filters.period = "CUSTOM";
    filters.from = from;
    if (to && ISO_DATE.test(to)) filters.to = to;
  } else if (PERIOD_OPTIONS.some((option) => option.value === period)) {
    filters.period = period as AnalyticsPeriod;
  }
  return filters;
}

/** Query string for the page URL (lower-case, defaults left out). */
export function analyticsHref(filters: AnalyticsFilters, pathname = "/analytics"): string {
  const query = new URLSearchParams();
  if (filters.period === "CUSTOM" && filters.from) {
    query.set("from", filters.from);
    if (filters.to && filters.to !== filters.from) query.set("to", filters.to);
  } else {
    query.set("period", PERIOD_OPTIONS.find((o) => o.value === filters.period)?.param ?? "monthly");
  }
  if (filters.routerId) query.set("routerId", filters.routerId);
  if (filters.service !== "ALL") query.set("service", filters.service.toLowerCase());
  if (filters.interval) query.set("interval", filters.interval.toLowerCase());
  return `${pathname}?${query.toString()}`;
}

/**
 * Query string for the backend. `service` and `interval` are sent only where they apply:
 * the service filter narrows the payments trend alone, and the export ignores both.
 */
export function analyticsApiQuery(
  filters: AnalyticsFilters,
  include: { service?: boolean; interval?: boolean } = {}
): string {
  const query = new URLSearchParams();
  if (filters.period === "CUSTOM" && filters.from) {
    query.set("from", filters.from);
    if (filters.to) query.set("to", filters.to);
  } else {
    query.set("period", filters.period);
  }
  if (filters.routerId) query.set("routerId", filters.routerId);
  if (include.service && filters.service !== "ALL") query.set("service", filters.service);
  if (include.interval && filters.interval) query.set("interval", filters.interval);
  return query.toString();
}

/** Days from `from` to `to`, both included. */
export function rangeDays(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000) + 1;
}

/** Why a custom range cannot be applied, or null when it can. `today` is YYYY-MM-DD. */
export function customRangeProblem(from: string, to: string, today: string): string | null {
  if (!from) return "Pick a start date to report on.";
  if (!ISO_DATE.test(from) || (to && !ISO_DATE.test(to))) return "Enter dates as YYYY-MM-DD.";
  if (from > today) return "The start date cannot be after today.";
  if (to && to > today) return "The end date cannot be after today.";
  if (to && to < from) return "The end date cannot be before the start date.";
  if (to && rangeDays(from, to) > MAX_RANGE_DAYS) return `A range can cover at most ${MAX_RANGE_DAYS} days.`;
  return null;
}
