import { describe, it, expect, vi } from "vitest";

const mockEmptyResponse = () => ({
  data: {
    tenantName: "",
    shiftName: "",
    onlineSubscribersCount: 0,
    expiriesDue24hCount: 0,
    smsCreditLow: false,
    lastHourTrafficGb: 0,
    revenueToday: 0,
    revenueTodayChangePercent: 0,
    mobileMoneyRevenueToday: 0,
    activeSubscriptionsCount: 0,
    onlinePercentage: 0,
    smsCreditsCount: null,
    liveTicker: {
      amount: 0,
      account: "",
      timeAgo: "",
      healthyRouters: 0,
      totalRouters: 0,
    },
    renewalsDue: [],
    routerTraffic: [],
    whatsNextQueue: [],
    heatmap: {
      peakHour: "",
      quietestHour: "",
      weekdayAvgGb: "",
      weekendAvgGb: "",
      cells: [],
    },
    todayEventsCount: 0,
    todayRecentPayments: [],
  },
});

describe("getDashboardOverview", () => {
  it("returns empty state on fetch failure", async () => {
    vi.resetModules();
    vi.doMock("@/lib/auth", () => ({
      auth: vi.fn().mockResolvedValue({ user: { apiToken: "token" } }),
    }));

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
    }) as any;

    const { getDashboardOverview } = await import("@/actions/dashboard");
    const result = await getDashboardOverview();
    expect(result.smsCreditsCount).toBeNull();
    expect(result.revenueToday).toBe(0);
    expect(result.renewalsDue).toEqual([]);
  });

  it("merges live data into empty state on success", async () => {
    vi.resetModules();
    vi.doMock("@/lib/auth", () => ({
      auth: vi.fn().mockResolvedValue({ user: { apiToken: "token" } }),
    }));

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockEmptyResponse()),
    }) as any;

    const { getDashboardOverview } = await import("@/actions/dashboard");
    const result = await getDashboardOverview();
    expect(result.smsCreditsCount).toBeNull();
    expect(result.renewalsDue).toEqual([]);
    expect(result.heatmap.cells.length).toBe(0);
  });
});
