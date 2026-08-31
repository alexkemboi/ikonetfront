import { describe, it, expect, vi, beforeEach } from "vitest";
import { server } from "@/mocks/server";
import { http, HttpResponse } from "msw";
import { API_PREFIX } from "@/mocks/handlers/auth-guard";
import {
  getChartOfAccountsTree,
  getAccountBalances,
  getTrialBalance,
  getLedgerPostings,
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