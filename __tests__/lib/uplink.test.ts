import { describe, expect, it } from "vitest";
import { ageText, mbps, pingText, uplinkProblems } from "@/lib/utils/uplink";
import type { UplinkCheck } from "@/lib/types/uplink";

describe("uplink formatting", () => {
  it("ages", () => {
    expect(ageText(null)).toBe("never");
    expect(ageText(40)).toBe("40 s");
    expect(ageText(720)).toBe("12 min");
    expect(ageText(42_564)).toBe("11 h 49 min");
    expect(ageText(4 * 86_400)).toBe("4 days");
  });

  it("rates", () => {
    expect(mbps(null)).toBe("—");
    expect(mbps(60_000)).toBe("0.06 Mbps");
    expect(mbps(4_800_000)).toBe("4.8 Mbps");
  });

  it("pings", () => {
    expect(pingText({ pingLossPct: null, pingAvgMs: null })).toBe("not checked");
    expect(pingText({ pingLossPct: 100, pingAvgMs: null })).toBe("every ping lost");
    expect(pingText({ pingLossPct: 33, pingAvgMs: 52 })).toBe("33% loss · 52 ms");
  });

  it("problems are sites with no contact or poor internet, not a lost management tunnel", () => {
    const base = { routerId: 1, routerName: "r" } as UplinkCheck;
    const checks = [
      { ...base, routerId: 1, status: "DOWN" },
      { ...base, routerId: 2, status: "DEGRADED" },
      { ...base, routerId: 3, status: "TUNNEL_FAULT" },
      { ...base, routerId: 4, status: "UP" },
    ] as UplinkCheck[];
    expect(uplinkProblems(checks).map((c) => c.routerId)).toEqual([1, 2]);
  });
});
