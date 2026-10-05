import { describe, it, expect, vi, beforeEach } from "vitest";
import { server } from "@/mocks/server";
import { http, HttpResponse } from "msw";
import { API_PREFIX } from "@/mocks/handlers/auth-guard";
import {
  getChartOfAccountsTree,
  getAccountBalances,
  getTrialBalance,
  getLedgerPostings,
  getExpenses,
  getExpenseSummary,
  deleteExpense,
} from "@/actions/finance";
import type { AccountPosting, SpringPage } from "@/lib/types/finance";

const TOKEN = "mock-valid-bearer-token";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("CoA raw payload path (CoaController returns no envelope)", () => {
  it("getChartOfAccountsTree returns the Record keyed by account type", async () => {
    const tree = await getChartOfAccountsTree();
    expect(Object.keys(tree)).toEqual(
      expect.arrayContaining(["ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE"])
    );
    const assets = tree.ASSET ?? [];
    expect(assets[0].code).toBe("1000");
    expect(Array.isArray(assets[0].children)).toBe(true);
    expect(tree.INCOME?.[0].children?.length).toBeGreaterThan(0);
  });

  it("getAccountBalances returns the raw array", async () => {
    const balances = await getAccountBalances();
    expect(Array.isArray(balances)).toBe(true);
    expect(balances.length).toBeGreaterThan(0);
    expect(balances[0]).toHaveProperty("accountCode");
    expect(balances[0]).toHaveProperty("balance");
    expect(balances[0]).toHaveProperty("postingCount");
  });

  it("getTrialBalance returns the object with negative credits", async () => {
    const tb = await getTrialBalance();
    expect(tb).not.toBeNull();
    expect(tb?.isBalanced).toBe(true);
    expect(tb?.delta).toBe(0);
    expect(typeof tb?.credits).toBe("number");
    if (tb) expect(tb.credits).toBeLessThan(0);
    expect(Array.isArray(tb?.accounts)).toBe(true);
  });

  it("normalizes trial-balance accountCode entries without names", async () => {
    server.use(
      http.get(`${API_PREFIX}/finance/coa/trial-balance`, () =>
        HttpResponse.json({
          delta: 0,
          isBalanced: true,
          debits: 1278,
          credits: -1278,
          accounts: [
            { postingCount: 24, accountCode: "1110", balance: 24 },
            { postingCount: 1, accountCode: "1130", balance: 40 },
          ],
        })
      )
    );

    const tb = await getTrialBalance();
    expect(tb?.accounts).toEqual([
      { code: "1110", name: undefined, type: undefined, balance: 24 },
      { code: "1130", name: undefined, type: undefined, balance: 40 },
    ]);
  });

  it("getLedgerPostings wraps the raw array into a SpringPage", async () => {
    const page = await getLedgerPostings({ page: 0, size: 20 });
    expect(page.content).toHaveLength(2);
    expect(page.totalElements).toBe(2);
    expect(page.content[0].accountCode).toBe("4100");
    expect(page.content[0]).toHaveProperty("occurredAt");
  });
});

describe("CoA envelope path (body wrapped in { data })", () => {
  it("unwraps the tree envelope identically", async () => {
    server.use(
      http.get(`${API_PREFIX}/finance/coa`, ({ request }) => {
        expect(request.headers.get("authorization")).toBe(`Bearer ${TOKEN}`);
        return HttpResponse.json({
          success: true,
          data: {
            INCOME: [
              { id: 9, code: "4999", name: "Other Income", type: "INCOME", isActive: true, children: [] },
            ],
          },
        });
      })
    );
    const tree = await getChartOfAccountsTree();
    expect(tree.INCOME?.[0].code).toBe("4999");
  });

  it("unwraps the balances envelope", async () => {
    server.use(
      http.get(`${API_PREFIX}/finance/coa/balance`, ({ request }) => {
        expect(request.headers.get("authorization")).toBe(`Bearer ${TOKEN}`);
        return HttpResponse.json({
          success: true,
          data: [{ accountCode: "9999", balance: 123, postingCount: 0 }],
        });
      })
    );
    const balances = await getAccountBalances();
    expect(balances[0].accountCode).toBe("9999");
    expect(balances[0].balance).toBe(123);
  });

  it("unwraps the trial-balance envelope and validates shape", async () => {
    server.use(
      http.get(`${API_PREFIX}/finance/coa/trial-balance`, ({ request }) => {
        expect(request.headers.get("authorization")).toBe(`Bearer ${TOKEN}`);
        return HttpResponse.json({
          success: true,
          data: { delta: 5, isBalanced: false, debits: 10, credits: -5, accounts: [] },
        });
      })
    );
    const tb = await getTrialBalance();
    expect(tb?.isBalanced).toBe(false);
    expect(tb?.delta).toBe(5);
  });

  it("unwraps the Spring Page envelope for postings", async () => {
    server.use(
      http.get(`${API_PREFIX}/finance/coa/postings`, ({ request }) => {
        expect(request.headers.get("authorization")).toBe(`Bearer ${TOKEN}`);
        const page: SpringPage<AccountPosting> = {
          content: [
            {
              id: 99,
              accountCode: "1000",
              sourceType: "TEST",
              amount: 100,
              currency: "KES",
              occurredAt: "2026-08-01T10:00:00",
              createdAt: "2026-08-01T10:00:00",
            },
          ],
          totalElements: 1,
          totalPages: 1,
          size: 20,
          number: 0,
          first: true,
          last: true,
          empty: false,
        };
        return HttpResponse.json({ success: true, data: page });
      })
    );
    const result = await getLedgerPostings({ page: 0, size: 20 });
    expect(result.content).toHaveLength(1);
    expect(result.totalElements).toBe(1);
  });
});

describe("ledger date normalization (architect hardening #1)", () => {
  it("normalizes bare YYYY-MM-DD to T00:00:00 / T23:59:59 before dispatch", async () => {
    server.use(
      http.get(`${API_PREFIX}/finance/coa/postings`, ({ request }) => {
        expect(request.headers.get("authorization")).toBe(`Bearer ${TOKEN}`);
        const params = new URL(request.url).searchParams;
        expect(params.get("fromDate")).toBe("2026-08-01T00:00:00");
        expect(params.get("toDate")).toBe("2026-08-31T23:59:59");
        const qs = params.toString();
        expect(qs).toContain("fromDate=2026-08-01T00%3A00%3A00");
        expect(qs).toContain("toDate=2026-08-31T23%3A59%3A59");
        expect(qs).not.toContain("fromDate=2026-08-01&");
        expect(qs).not.toContain("toDate=2026-08-31&");
        return HttpResponse.json([]);
      })
    );
    const result = await getLedgerPostings({ fromDate: "2026-08-01", toDate: "2026-08-31", page: 0, size: 20 });
    expect(result.content).toEqual([]);
  });

  it("passes pre-normalized ISO date-time values through unchanged", async () => {
    server.use(
      http.get(`${API_PREFIX}/finance/coa/postings`, ({ request }) => {
        expect(request.headers.get("authorization")).toBe(`Bearer ${TOKEN}`);
        const params = new URL(request.url).searchParams;
        expect(params.get("fromDate")).toBe("2026-08-01T10:00:00");
        expect(params.get("toDate")).toBeNull();
        expect(params.toString()).toContain("fromDate=2026-08-01T10%3A00%3A00");
        return HttpResponse.json([]);
      })
    );
    await getLedgerPostings({ fromDate: "2026-08-01T10:00:00", page: 0, size: 20 });
  });

  it("omits date params entirely when none are provided", async () => {
    server.use(
      http.get(`${API_PREFIX}/finance/coa/postings`, ({ request }) => {
        expect(request.headers.get("authorization")).toBe(`Bearer ${TOKEN}`);
        const params = new URL(request.url).searchParams;
        expect(params.get("fromDate")).toBeNull();
        expect(params.get("toDate")).toBeNull();
        return HttpResponse.json([]);
      })
    );
    await getLedgerPostings({ page: 0, size: 20 });
  });
});

describe("CoA bearer wiring", () => {
  it("sends the Bearer token on every CoA read", async () => {
    server.use(
      http.get(`${API_PREFIX}/finance/coa`, ({ request }) => {
        expect(request.headers.get("authorization")).toBe(`Bearer ${TOKEN}`);
        return HttpResponse.json({});
      }),
      http.get(`${API_PREFIX}/finance/coa/balance`, ({ request }) => {
        expect(request.headers.get("authorization")).toBe(`Bearer ${TOKEN}`);
        return HttpResponse.json([]);
      }),
      http.get(`${API_PREFIX}/finance/coa/trial-balance`, ({ request }) => {
        expect(request.headers.get("authorization")).toBe(`Bearer ${TOKEN}`);
        return HttpResponse.json({});
      }),
      http.get(`${API_PREFIX}/finance/coa/postings`, ({ request }) => {
        expect(request.headers.get("authorization")).toBe(`Bearer ${TOKEN}`);
        return HttpResponse.json([]);
      })
    );

    await getChartOfAccountsTree();
    await getAccountBalances();
    await getTrialBalance();
    await getLedgerPostings({ page: 0, size: 20 });
  });
});

describe("getExpenses normalization (crash vector #1)", () => {
  it("wraps a bare-array response into a SpringPage", async () => {
    server.use(
      http.get(`${API_PREFIX}/expenses`, ({ request }) => {
        expect(request.headers.get("authorization")).toBe(`Bearer ${TOKEN}`);
        return HttpResponse.json([
          {
            id: "bare-array-uuid-1",
            amount: 100,
            description: "Bare array expense",
            category: "OTHER",
            currency: "KES",
            status: "PAID",
            expenseDate: "2026-08-01",
            createdAt: "2026-08-01T08:00:00",
            updatedAt: "2026-08-01T08:00:00",
          },
        ]);
      })
    );
    const res = await getExpenses({ page: 0, size: 20 });
    expect(res.success).toBe(true);
    expect(res.data?.content).toHaveLength(1);
    expect(res.data?.totalElements).toBe(1);
    expect(res.data?.content[0].id).toBe("bare-array-uuid-1");
  });

  it("passes the contract envelope through with string UUID ids", async () => {
    const res = await getExpenses({ page: 0, size: 20 });
    expect(res.success).toBe(true);
    expect(res.data?.content).toHaveLength(2);
    expect(res.data?.totalElements).toBe(2);
    expect(typeof res.data?.content[0].id).toBe("string");
  });

  it("returns a usable empty page on failure", async () => {
    server.use(
      http.get(`${API_PREFIX}/expenses`, () =>
        HttpResponse.json({ success: false, message: "boom" }, { status: 500 })
      )
    );
    const res = await getExpenses({ page: 0, size: 20 });
    expect(res.success).toBe(false);
    expect(res.data?.content).toEqual([]);
    expect(res.data?.empty).toBe(true);
  });
});

describe("getExpenseSummary normalization (crash vector #2)", () => {
  it("maps backend totalExpenses/expenseCount/expensesByCategory to the frontend shape", async () => {
    const res = await getExpenseSummary("2026-08-01", "2026-08-31");
    expect(res.success).toBe(true);
    expect(res.data).toEqual({
      totalAmount: 15500,
      totalCount: 2,
      byCategory: { EQUIPMENT: 12000, MAINTENANCE: 3500 },
    });
  });

  it("tolerates a missing expensesByCategory (partial fields)", async () => {
    server.use(
      http.get(`${API_PREFIX}/expenses/summary`, () =>
        HttpResponse.json({ success: true, data: { totalExpenses: 100, expenseCount: 1 } })
      )
    );
    const res = await getExpenseSummary("2026-08-01", "2026-08-31");
    expect(res.data).toEqual({ totalAmount: 100, totalCount: 1, byCategory: {} });
  });

  it("returns success:false + data:null on a failed envelope", async () => {
    server.use(
      http.get(`${API_PREFIX}/expenses/summary`, () =>
        HttpResponse.json({ success: false, message: "nope" }, { status: 400 })
      )
    );
    const res = await getExpenseSummary("2026-08-01", "2026-08-31");
    expect(res.success).toBe(false);
    expect(res.data).toBeNull();
    expect(res.message).toBe("nope");
  });
});

describe("deleteExpense with string UUID", () => {
  it("DELETEs /expenses/{uuid} without numeric coercion", async () => {
    const uuid = "0c5d80f1-3b9a-4c6e-8f2a-7d1e9b3a4c55";
    server.use(
      http.delete(`${API_PREFIX}/expenses/:id`, ({ request }) => {
        expect(request.url).toContain(`/expenses/${uuid}`);
        return new HttpResponse(null, { status: 204 });
      })
    );
    const res = await deleteExpense(uuid);
    expect(res.success).toBe(true);
    expect(res.status).toBe(204);
  });
});