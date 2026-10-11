import { describe, expect, it } from "vitest";
import { analyticsApiQuery, analyticsHref, customRangeProblem, parseAnalyticsFilters, rangeDays } from "@/lib/analytics/filters";
import { formatCompact, formatDelta, formatDuration, formatMoney, periodLabel } from "@/lib/analytics/format";
import { heatStep } from "@/components/analytics/HeatmapGrid";

describe("analytics filters", () => {
  it("defaults to this month, all routers, all services", () => {
    expect(parseAnalyticsFilters({})).toEqual({ period: "MONTHLY", service: "ALL" });
  });

  it("reads the URL the page writes, in any letter case", () => {
    const filters = parseAnalyticsFilters({ period: "weekly", service: "pppoe", interval: "month", routerId: "54" });
    expect(filters).toEqual({ period: "WEEKLY", service: "PPPOE", interval: "MONTH", routerId: "54" });
    expect(analyticsHref(filters)).toBe("/analytics?period=weekly&routerId=54&service=pppoe&interval=month");
  });

  it("custom dates win over a period and round-trip through the URL", () => {
    const filters = parseAnalyticsFilters({ period: "daily", from: "2026-10-01", to: "2026-10-10" });
    expect(filters.period).toBe("CUSTOM");
    expect(analyticsHref(filters)).toBe("/analytics?from=2026-10-01&to=2026-10-10");
    expect(analyticsHref({ period: "CUSTOM", from: "2026-10-03", to: "2026-10-03", service: "ALL" })).toBe("/analytics?from=2026-10-03");
  });

  it("ignores values it does not know instead of sending them on", () => {
    expect(parseAnalyticsFilters({ period: "fortnight", service: "tv", interval: "hour", routerId: "1 OR 1=1", from: "yesterday" })).toEqual({
      period: "MONTHLY",
      service: "ALL",
    });
  });

  it("sends service and bar size only to the endpoints they apply to", () => {
    const filters = parseAnalyticsFilters({ period: "weekly", service: "hotspot", interval: "week", routerId: "7" });
    expect(analyticsApiQuery(filters)).toBe("period=WEEKLY&routerId=7");
    expect(analyticsApiQuery(filters, { interval: true })).toBe("period=WEEKLY&routerId=7&interval=WEEK");
    expect(analyticsApiQuery(filters, { service: true, interval: true })).toBe("period=WEEKLY&routerId=7&service=HOTSPOT&interval=WEEK");
  });

  it("explains why a custom range cannot be applied", () => {
    const today = "2026-10-10";
    expect(customRangeProblem("", "", today)).toBe("Pick a start date to report on.");
    expect(customRangeProblem("2026-10-11", "", today)).toMatch(/start date cannot be after today/);
    expect(customRangeProblem("2026-10-01", "2026-10-11", today)).toMatch(/end date cannot be after today/);
    expect(customRangeProblem("2026-10-05", "2026-10-01", today)).toMatch(/before the start date/);
    expect(customRangeProblem("2025-10-09", "2026-10-10", today)).toMatch(/at most 366 days/);
    expect(customRangeProblem("2025-10-10", "2026-10-10", today)).toBeNull();
    expect(customRangeProblem("2026-10-03", "", today)).toBeNull();
    expect(rangeDays("2026-10-01", "2026-10-10")).toBe(10);
  });
});

describe("analytics formatting", () => {
  it("shows money as sent, grouped, with cents only when there are any", () => {
    expect(formatMoney("107620.00", "KES")).toBe("Ksh 107,620");
    expect(formatMoney("1395825.50", "KES")).toBe("Ksh 1,395,825.50");
    expect(formatMoney("-250.00", "USD")).toBe("-USD 250");
    expect(formatMoney(null, "KES")).toBe("—");
    // larger than a JavaScript number can hold exactly
    expect(formatMoney("100000000000000000.01", "KES")).toBe("Ksh 100,000,000,000,000,000.01");
  });

  it("never invents a percentage when there is nothing to compare with", () => {
    expect(formatDelta(null, "NO_PREVIOUS")).toBeNull();
    expect(formatDelta("-51.70", "DOWN")).toBe("▼ 51.7%");
    expect(formatDelta("0.21", "UP")).toBe("▲ 0.2%");
    expect(formatDelta("93156.30", "UP")).toBe("▲ 93,156.3%");
  });

  it("formats durations, axis ticks and period titles", () => {
    expect(formatDuration(7800)).toBe("2h 10m");
    expect(formatDuration(45)).toBe("45s");
    expect(formatDuration(null)).toBe("—");
    expect(formatCompact(500_000)).toBe("500K");
    expect(formatCompact(1_250_000)).toBe("1.3M");
    expect(periodLabel({ period: "LAST_YEAR", from: "2025-01-01", to: "2025-12-31" })).toBe("Last Year");
    expect(periodLabel({ period: "CUSTOM", from: "2026-10-01", to: "2026-10-10" })).toBe("Oct 1 – Oct 10, 2026");
  });

  it("keeps an empty heatmap cell apart from the lightest filled one", () => {
    expect(heatStep(0, 10)).toBe(0);
    expect(heatStep(1, 100)).toBe(1);
    expect(heatStep(100, 100)).toBe(5);
    expect(heatStep(5, 0)).toBe(0);
  });
});
