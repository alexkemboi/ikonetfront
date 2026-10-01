import { describe, expect, it } from "vitest";
import { addDaysToDateOnly, daysBetweenDateOnly, formatDateOnly } from "@/lib/dates";
import { formatBytes } from "@/lib/utils/formatBytes";

describe("plain business dates", () => {
  it("formats and compares date-only values without timezone conversion", () => {
    expect(formatDateOnly("2026-10-01", "en-CA")).toBe("Oct 1, 2026");
    expect(daysBetweenDateOnly("2026-09-29", "2026-10-01")).toBe(2);
    expect(addDaysToDateOnly("2026-09-29", 7)).toBe("2026-10-06");
    expect(daysBetweenDateOnly("invalid", "2026-10-01")).toBeNull();
  });
});

describe("BigInt-safe byte formatting", () => {
  it("preserves large values and missing counters", () => {
    expect(formatBytes("8589934597")).toBe("8.5 GB");
    expect(formatBytes("10000000000000001")).toBe("10.0 PB");
    expect(formatBytes(null)).toBe("-");
  });
});