import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { authMock } = vi.hoisted(() => ({ authMock: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: authMock }));

import { getInvestorMoneyFlowData } from "@/actions/investor";

const revenueBody = {
  investorId: "inv-1",
  periodYearMonth: "2026-10",
  totalGrossRevenue: 100,
  hotspotGrossRevenue: 60,
  hotspotMaintenanceFee: 2,
  activePppoeSubscribers: 4,
  pppoeMaintenanceFee: 100,
  totalMaintenanceDue: 102,
  netInvestorPayout: -2,
  routerBreakdown: [],
};

function jsonResponse(body: unknown): Response {
  return { ok: true, status: 200, json: async () => body } as unknown as Response;
}

describe("getInvestorMoneyFlowData (RB-5 / D-35)", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("role 04 reads only revenue and never calls snapshots/agreements", async () => {
    authMock.mockResolvedValue({ user: { role: "04", apiToken: "token" } });
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue(jsonResponse(revenueBody));

    const data = await getInvestorMoneyFlowData();

    expect(data.billingDetailsVisible).toBe(false);
    expect(data.snapshots).toEqual([]);
    expect(data.agreements).toEqual([]);
    expect(data.allAvailable).toBe(true);

    const urls = fetchMock.mock.calls.map((call) => String(call[0]));
    expect(urls.some((u) => u.includes("/investor/revenue"))).toBe(true);
    expect(urls.some((u) => u.includes("/investor/billing-snapshots"))).toBe(false);
    expect(urls.some((u) => u.includes("/investor/agreements"))).toBe(false);
  });

  it("company role (01) reads revenue only, hides billing detail", async () => {
    authMock.mockResolvedValue({ user: { role: "01", apiToken: "token" } });
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue(jsonResponse(revenueBody));

    const data = await getInvestorMoneyFlowData();

    expect(data.billingDetailsVisible).toBe(false);
    expect(data.revenue).not.toBeNull();
    const urls = fetchMock.mock.calls.map((call) => String(call[0]));
    expect(urls.some((u) => u.includes("/investor/billing-snapshots"))).toBe(false);
    expect(urls.some((u) => u.includes("/investor/agreements"))).toBe(false);
  });

  it("SYSADMIN reads all three sections", async () => {
    authMock.mockResolvedValue({ user: { role: "SYSADMIN", apiToken: "token" } });
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockImplementation((url: string) => {
      const target = String(url);
      if (target.includes("/investor/revenue")) return Promise.resolve(jsonResponse(revenueBody));
      if (target.includes("/investor/billing-snapshots")) return Promise.resolve(jsonResponse([{ id: "s1" }]));
      if (target.includes("/investor/agreements")) return Promise.resolve(jsonResponse([{ id: "a1" }]));
      return Promise.resolve(jsonResponse(null));
    });

    const data = await getInvestorMoneyFlowData();

    expect(data.billingDetailsVisible).toBe(true);
    expect(data.snapshots).toHaveLength(1);
    expect(data.agreements).toHaveLength(1);
    expect(data.allAvailable).toBe(true);
  });
});
