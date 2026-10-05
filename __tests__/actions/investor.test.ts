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

  it("sends company and investor filters only for SYSADMIN revenue reads", async () => {
    authMock.mockResolvedValue({ user: { role: "SYSADMIN", apiToken: "token" } });
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue(jsonResponse(revenueBody));

    await getInvestorMoneyFlowData({
      period: "2026-09",
      companyId: "CMP-BST-001",
      investorId: "investor-uuid",
    });

    const revenueUrl = String(fetchMock.mock.calls[0][0]);
    expect(revenueUrl).toContain("period=2026-09");
    expect(revenueUrl).toContain("companyId=CMP-BST-001");
    expect(revenueUrl).toContain("investorId=investor-uuid");
  });

  it("does not allow company or investor query filters to widen a company user's scope", async () => {
    authMock.mockResolvedValue({ user: { role: "01", apiToken: "token" } });
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue(jsonResponse(revenueBody));

    await getInvestorMoneyFlowData({
      period: "2026-09",
      companyId: "other-company",
      investorId: "other-investor",
    });

    const revenueUrl = String(fetchMock.mock.calls[0][0]);
    expect(revenueUrl).toContain("period=2026-09");
    expect(revenueUrl).not.toContain("companyId=");
    expect(revenueUrl).not.toContain("investorId=");
  });
});
