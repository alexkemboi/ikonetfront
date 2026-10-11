import type { AnalyticsContext, AnalyticsPeriod, Comparison } from "@/lib/types/analytics";

/** "Ksh 107,620" style: the amount as the backend sent it, grouped, cents only when there are any. */
export function formatMoney(amount: string | null | undefined, currency: string): string {
  if (amount == null) return "—";
  const negative = amount.startsWith("-");
  const [whole, cents = ""] = (negative ? amount.slice(1) : amount).split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const tail = /^0*$/.test(cents) ? "" : `.${cents.padEnd(2, "0").slice(0, 2)}`;
  return `${negative ? "-" : ""}${currencyLabel(currency)} ${grouped}${tail}`;
}

/** Axis ticks: 0, 500, 5K, 1.2M. */
export function formatCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${trim(value / 1_000_000_000)}B`;
  if (abs >= 1_000_000) return `${trim(value / 1_000_000)}M`;
  if (abs >= 1_000) return `${trim(value / 1_000)}K`;
  return String(Math.round(value));
}

function trim(value: number): string {
  return value.toFixed(1).replace(/\.0$/, "");
}

export function currencyLabel(currency: string): string {
  return currency === "KES" ? "Ksh" : currency;
}

export function formatCount(value: number | null | undefined): string {
  return value == null ? "—" : value.toLocaleString("en-US");
}

/** 2h 10m, 45m, 30s. */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null) return "—";
  const total = Math.max(0, Math.round(seconds));
  const days = Math.floor(total / 86_400);
  const hours = Math.floor((total % 86_400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${total}s`;
}

/** "▲ 0.2%", "▼ 51.7%", or null when there is nothing to compare with. */
export function formatDelta(deltaPercent: string | null, comparison: Comparison): string | null {
  if (deltaPercent == null || comparison === "NO_PREVIOUS") return null;
  const value = Math.abs(Number.parseFloat(deltaPercent));
  if (!Number.isFinite(value)) return null;
  const shown = value.toLocaleString("en-US", { maximumFractionDigits: 1 });
  return `${comparison === "DOWN" ? "▼" : "▲"} ${shown}%`;
}

/** A percentage or ratio string from the backend with at most one decimal: "31.03" -> "31", "2.93" -> "2.9". */
export function formatDecimal(value: string | null | undefined): string {
  if (value == null) return "—";
  const number = Number.parseFloat(value);
  return Number.isFinite(number) ? number.toLocaleString("en-US", { maximumFractionDigits: 1 }) : "—";
}

const PERIOD_LABELS: Record<AnalyticsPeriod, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
  LAST_YEAR: "Last Year",
  CUSTOM: "Custom",
};

function day(date: string, withYear: boolean): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(withYear ? { year: "numeric" } : {}),
    timeZone: "UTC",
  });
}

/** The period as panel titles show it: "Daily", or "Oct 1 – Oct 10, 2026" for custom dates. */
export function periodLabel(context: Pick<AnalyticsContext, "period" | "from" | "to">): string {
  if (context.period !== "CUSTOM") return PERIOD_LABELS[context.period];
  return context.from === context.to ? day(context.from, true) : `${day(context.from, false)} – ${day(context.to, true)}`;
}

/** The exact dates behind a period, for tooltips and the context line. */
export function dateRangeLabel(from: string, to: string): string {
  return from === to ? day(from, true) : `${day(from, false)} – ${day(to, true)}`;
}

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
