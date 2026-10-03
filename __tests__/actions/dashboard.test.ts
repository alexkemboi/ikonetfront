import { describe, it, expect, vi } from "vitest";
import { redirect } from "next/navigation";

const mockEmptyResponse = () => ({
  data: {
    companyName: "",
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
  it("returns an unavailable result on fetch failure", async () => {
    vi.resetModules();
    vi.doMock("@/lib/auth", () => ({
      auth: vi.fn().mockResolvedValue({ user: { apiToken: "token" } }),
    }));

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      headers: { get: (name: string) => name === "content-type" ? "application/json" : null },
      json: vi.fn().mockResolvedValue({
        status: 503,
        success: false,
        message: "DASHBOARD_UNAVAILABLE",
        data: { requestId: "req-dashboard-1" },
      }),
    }) as unknown as typeof fetch;

    const { getDashboardOverview } = await import("@/actions/dashboard");
    const result = await getDashboardOverview();
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/v1\/dashboard\/operations-cockpit$/),
      expect.any(Object)
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.message).toBe("DASHBOARD_UNAVAILABLE");
      expect(result.requestId).toBe("req-dashboard-1");
    }
  });

  it("returns live dashboard data on success", async () => {
    vi.resetModules();
    vi.doMock("@/lib/auth", () => ({
      auth: vi.fn().mockResolvedValue({ user: { apiToken: "token" } }),
    }));

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: (name: string) => name === "content-type" ? "application/json" : null },
      json: vi.fn().mockResolvedValue({
        status: 200,
        success: true,
        message: "OK",
        ...mockEmptyResponse(),
        timestamp: "2026-09-30T10:00:00Z",
      }),
    }) as unknown as typeof fetch;

    const { getDashboardOverview } = await import("@/actions/dashboard");
    const result = await getDashboardOverview();
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.smsCreditsCount).toBeNull();
      expect(result.data.renewalsDue).toEqual([]);
      expect(result.data.heatmap.cells.length).toBe(0);
    }
  });

  it("redirects to /signout?reason=session-expired on a 401 instead of surfacing the raw backend message", async () => {
    vi.resetModules();
    vi.doMock("@/lib/auth", () => ({
      auth: vi.fn().mockResolvedValue({ user: { apiToken: "expired-token" } }),
    }));

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      headers: { get: (name: string) => name === "content-type" ? "application/json" : null },
      json: vi.fn().mockResolvedValue({
        status: 401,
        success: false,
        message: "TOKEN_INVALID_OR_EXPIRED",
        data: null,
      }),
    }) as unknown as typeof fetch;

    const { getDashboardOverview } = await import("@/actions/dashboard");
    await getDashboardOverview();
    expect(vi.mocked(redirect)).toHaveBeenCalledWith("/signout?reason=session-expired");
  });
});
