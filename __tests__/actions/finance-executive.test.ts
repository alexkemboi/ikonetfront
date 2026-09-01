import { describe, it, expect, vi, beforeEach } from "vitest";
import { server } from "@/mocks/server";
import { http, HttpResponse } from "msw";
import { API_PREFIX } from "@/mocks/handlers/auth-guard";
import { getLiveExecutiveDashboardData } from "@/actions/finance";
import { auth } from "@/lib/auth";

const TOKEN = "mock-valid-bearer-token";

const EMPTY_REPORT = {
  revenue: [],
  expenses: [],
  totalRevenue: 0,
  totalExpenses: 0,
  netIncome: 0,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getLiveExecutiveDashboardData — profit & loss", () => {
  it("maps a raw (no-envelope) report with contract codes 4100/4200", async () => {
    server.use(
      http.get(`${API_PREFIX}/finance/reports/profit-loss`, ({ request }) => {
        expect(request.headers.get("authorization")).toBe(`Bearer ${TOKEN}`);
        return HttpResponse.json({
          revenue: [
            { accountCode: "4100", accountName: "PPPoE Revenue", amount: 95000 },
            { accountCode: "4200", accountName: "Hotspot Revenue", amount: 42000 },
          ],
          expenses: [{ accountCode: "5100", accountName: "Operating Expenses", amount: 30000 }],
          totalRevenue: 137000,
          totalExpenses: 30000,
          netIncome: 107000,
        });
      })
    );
    const { pnl } = await getLiveExecutiveDashboardData();
    expect(pnl.netProfit).toBe(107000);
    expect(pnl.totalRevenue).toBe(137000);
    expect(pnl.totalExpenses).toBe(30000);
    expect(pnl.pppoeRevenue).toBe(95000);
    expect(pnl.hotspotRevenue).toBe(42000);
  });

  it("unwraps a { data: report } envelope", async () => {
    server.use(
      http.get(`${API_PREFIX}/finance/reports/profit-loss`, () =>
        HttpResponse.json({
          success: true,
          data: {
            revenue: [],
            expenses: [],
            totalRevenue: 100,
            totalExpenses: 40,
            netIncome: 60,
          },
        })
      )
    );
    const { pnl } = await getLiveExecutiveDashboardData();
    expect(pnl.totalRevenue).toBe(100);
    expect(pnl.netProfit).toBe(60);
  });

  it("falls back to account-name substrings when codes differ", async () => {
    server.use(
      http.get(`${API_PREFIX}/finance/reports/profit-loss`, () =>
        HttpResponse.json({
          revenue: [
            { accountCode: "4999", accountName: "PPPoE Internet Service", amount: 5000 },
            { accountCode: "4998", accountName: "Hotspot Voucher Sales", amount: 2500 },
          ],
          expenses: [],
          totalRevenue: 7500,
          totalExpenses: 0,
          netIncome: 7500,
        })
      )
    );
    const { pnl } = await getLiveExecutiveDashboardData();
    expect(pnl.pppoeRevenue).toBe(5000);
    expect(pnl.hotspotRevenue).toBe(2500);
  });

  it("never hard-fails on missing revenue lines", async () => {
    server.use(
      http.get(`${API_PREFIX}/finance/reports/profit-loss`, () =>
        HttpResponse.json({ ...EMPTY_REPORT })
      )
    );
    const { pnl } = await getLiveExecutiveDashboardData();
    expect(pnl.pppoeRevenue).toBe(0);
    expect(pnl.hotspotRevenue).toBe(0);
  });
});

describe("getLiveExecutiveDashboardData — recent transactions", () => {
  it("unwraps data.content from the Page envelope", async () => {
    const { recentTransactions } = await getLiveExecutiveDashboardData();
    expect(recentTransactions).toHaveLength(2);
    expect(recentTransactions[0]).toHaveProperty("accountCode");
    expect(recentTransactions[0]).toHaveProperty("occurredAt");
  });

  it("unwraps a bare-array response", async () => {
    server.use(
      http.get(`${API_PREFIX}/finance/transactions`, () =>
        HttpResponse.json([
          {
            id: 7,
            accountCode: "1110",
            sourceType: "MPESA",
            amount: 100,
            currency: "KES",
            occurredAt: "2026-08-31T09:00:00",
            createdAt: "2026-08-31T09:00:00",
          },
        ])
      )
    );
    const { recentTransactions } = await getLiveExecutiveDashboardData();
    expect(recentTransactions).toHaveLength(1);
    expect(recentTransactions[0].accountCode).toBe("1110");
  });
});

describe("getLiveExecutiveDashboardData — clearing balance", () => {
  it("picks the Account 1110 balance from /finance/coa/balance", async () => {
    server.use(
      http.get(`${API_PREFIX}/finance/coa/balance`, () =>
        HttpResponse.json([
          { accountCode: "1000", accountName: "Cash & Bank", balance: 400000, postingCount: 5 },
          { accountCode: "1110", accountName: "M-Pesa Clearing", balance: 25000, postingCount: 9 },
        ])
      )
    );
    const { clearingBalance } = await getLiveExecutiveDashboardData();
    expect(clearingBalance).toBe(25000);
  });

  it("also accepts the M_PESA_RECEIVABLE alias", async () => {
    server.use(
      http.get(`${API_PREFIX}/finance/coa/balance`, () =>
        HttpResponse.json([
          { accountCode: "M_PESA_RECEIVABLE", accountName: "M-Pesa Receivable", balance: 1500, postingCount: 2 },
        ])
      )
    );
    const { clearingBalance } = await getLiveExecutiveDashboardData();
    expect(clearingBalance).toBe(1500);
  });

  it("returns 0 when no clearing account exists", async () => {
    const { clearingBalance } = await getLiveExecutiveDashboardData();
    expect(clearingBalance).toBe(0);
  });
});

describe("getLiveExecutiveDashboardData — date normalization", () => {
  it("normalizes YYYY-MM-DD to T00:00:00 / T23:59:59 on the P&L request", async () => {
    server.use(
      http.get(`${API_PREFIX}/finance/reports/profit-loss`, ({ request }) => {
        const params = new URL(request.url).searchParams;
        expect(params.get("startDate")).toBe("2026-08-01T00:00:00");
        expect(params.get("endDate")).toBe("2026-08-31T23:59:59");
        return HttpResponse.json(EMPTY_REPORT);
      }),
      http.get(`${API_PREFIX}/finance/transactions`, ({ request }) => {
        const params = new URL(request.url).searchParams;
        expect(params.get("page")).toBe("0");
        expect(params.get("size")).toBe("10");
        expect(params.get("sort")).toBe("occurredAt,desc");
        return HttpResponse.json({ success: true, data: { content: [] } });
      })
    );
    await getLiveExecutiveDashboardData("2026-08-01", "2026-08-31");
  });

  it("defaults the window to the current month start → end of today", async () => {
    let capturedStart = "";
    let capturedEnd = "";
    server.use(
      http.get(`${API_PREFIX}/finance/reports/profit-loss`, ({ request }) => {
        const params = new URL(request.url).searchParams;
        capturedStart = params.get("startDate") ?? "";
        capturedEnd = params.get("endDate") ?? "";
        return HttpResponse.json(EMPTY_REPORT);
      })
    );
    await getLiveExecutiveDashboardData();

    // The default window is the LOCAL calendar month → today (not UTC-sliced).
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const expectedStart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01T00:00:00`;
    const expectedEnd = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T23:59:59`;
    expect(capturedStart).toBe(expectedStart);
    expect(capturedEnd).toBe(expectedEnd);
  });
});

describe("getLiveExecutiveDashboardData — zero-safe", () => {
  it("returns all-zero values without a token (never demo numbers)", async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as never);
    const data = await getLiveExecutiveDashboardData();
    expect(data.pnl).toMatchObject({
      totalRevenue: 0,
      totalExpenses: 0,
      netProfit: 0,
      pppoeRevenue: 0,
      hotspotRevenue: 0,
    });
    expect(data.recentTransactions).toEqual([]);
    expect(data.clearingBalance).toBe(0);
  });
});