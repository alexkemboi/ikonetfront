"use server";

import { updateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { buildApiUrl } from "@/lib/constants";
import { apiFetch } from "@/lib/apiClient";
import { timeoutSignal, unwrapPostings } from "@/lib/finance/ledger";
import type { ApiResponse } from "@/lib/types/auth";
import type {
  AccountBalanceProjection,
  AccountPosting,
  ChartOfAccountNode,
  Expense,
  ExpenseCategory,
  ExpenseRequest,
  ExpenseSummary,
  ProfitAndLossSummary,
  ProfitLossReport,
  SpringPage,
  Statement,
  StatementRequest,
  TrialBalanceResponse,
} from "@/lib/types/finance";
import { EMPTY_PAGE } from "@/lib/types/finance";

// ── Tolerant auth headers (returns {} when no token) ──────────────────────────

async function getAuthHeaders(): Promise<Record<string, string>> {
  const session = await auth();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (session?.user?.apiToken) {
    headers["Authorization"] = `Bearer ${session.user.apiToken}`;
  }
  return headers;
}

/**
 * Defensive unwrap shared by the four CoA reads. The backend returns raw
 * payloads (no `ApiResponse<T>` envelope) for `/finance/coa*`; when the
 * backend does (or later does) wrap a body in `{ data: ... }`, this still
 * unwraps it. Raw non-envelope bodies pass through untouched.
 */
function unwrapData<T>(json: unknown): T | null | undefined {
  if (typeof json === "object" && json !== null && "data" in json) {
    return (json as { data?: T }).data;
  }
  return json as T;
}

// ── CoA reads (raw /finance/coa* payloads — no envelope) ─────────────────────

export async function getChartOfAccountsTree(): Promise<Record<string, ChartOfAccountNode[]>> {
  try {
    const res = await fetch(buildApiUrl("/finance/coa"), {
      headers: await getAuthHeaders(),
      cache: "no-store",
    });
    if (!res.ok) return {};
    const raw = unwrapData<Record<string, ChartOfAccountNode[]>>(await res.json());
    return typeof raw === "object" && raw !== null ? raw : {};
  } catch (error) {
    console.error("[Finance] getChartOfAccountsTree error:", error);
    return {};
  }
}

export async function getAccountBalances(): Promise<AccountBalanceProjection[]> {
  try {
    const res = await fetch(buildApiUrl("/finance/coa/balance"), {
      headers: await getAuthHeaders(),
      cache: "no-store",
    });
    if (!res.ok) return [];
    const list = unwrapData<AccountBalanceProjection[]>(await res.json());
    return Array.isArray(list) ? list : [];
  } catch (error) {
    console.error("[Finance] getAccountBalances error:", error);
    return [];
  }
}

export async function getTrialBalance(): Promise<TrialBalanceResponse | null> {
  try {
    const res = await fetch(buildApiUrl("/finance/coa/trial-balance"), {
      headers: await getAuthHeaders(),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const raw = unwrapData<TrialBalanceResponse>(await res.json());
    if (typeof raw !== "object" || raw === null) return null;
    if (typeof raw.delta !== "number" || typeof raw.isBalanced !== "boolean") return null;
    if (typeof raw.debits !== "number" || typeof raw.credits !== "number") return null;
    if (!Array.isArray(raw.accounts)) return null;
    return raw;
  } catch (error) {
    console.error("[Finance] getTrialBalance error:", error);
    return null;
  }
}

// ── Executive dashboard (live data, zero dummy numbers) ──────────────────────

const ZERO_PNL: ProfitAndLossSummary = {
  totalRevenue: 0,
  totalExpenses: 0,
  netProfit: 0,
  pppoeRevenue: 0,
  hotspotRevenue: 0,
  startDate: "",
  endDate: "",
};

function currentMonthWindow(): { from: string; to: string } {
  // Local-calendar window — never slice `toISOString()` (UTC), which shifts the
  // first-of-month a day into the previous month in any timezone ahead of UTC.
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    from: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`,
    to: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
  };
}

function zeroSafePnl(from: string, to: string): ProfitAndLossSummary {
  return { ...ZERO_PNL, startDate: from, endDate: to };
}

/**
 * Map the backend `ProfitLossReport` into the dashboard's `ProfitAndLossSummary`.
 * Revenue lines are matched by account code (4100 = PPPoE, 4200 = Hotspot per the
 * contract fixture) with a name-substring fallback; missing lines never fail.
 */
function normalizeProfitLossReport(
  json: unknown,
  from: string,
  to: string
): ProfitAndLossSummary {
  const report = unwrapData<ProfitLossReport>(json);
  if (typeof report !== "object" || report === null) return zeroSafePnl(from, to);
  const revenue = Array.isArray(report.revenue) ? report.revenue : [];

  const match = (codes: string[], needles: string[]): number => {
    const byCode = revenue.find((line) => codes.includes(line.accountCode));
    if (byCode) return byCode.amount;
    const byName = revenue.find((line) =>
      needles.some((n) => (line.accountName ?? "").toLowerCase().includes(n))
    );
    return byName?.amount ?? 0;
  };

  return {
    totalRevenue: report.totalRevenue ?? 0,
    totalExpenses: report.totalExpenses ?? 0,
    netProfit: report.netIncome ?? 0,
    pppoeRevenue: match(["4100"], ["pppoe"]),
    hotspotRevenue: match(["4200"], ["hotspot"]),
    startDate: report.startDate ?? from,
    endDate: report.endDate ?? to,
  };
}

/** Pick the M-Pesa clearing account (1110) balance; zero when unavailable. */
function unwrapClearingBalance(json: unknown): number {
  const list = unwrapData<AccountBalanceProjection[]>(json);
  if (!Array.isArray(list)) return 0;
  return (
    list.find(
      (b) => b.accountCode === "1110" || b.accountCode === "M_PESA_RECEIVABLE"
    )?.balance ?? 0
  );
}

/**
 * Live executive dashboard feed. Three parallel reads from the backend
 * (`/finance/reports/profit-loss` with the contract-required dates,
 * `/finance/transactions` page 0, `/finance/coa/balance` for the 1110
 * clearing balance). Every failure path returns zeros — never demo numbers.
 * The backend requires `startDate`/`endDate` (`date-time`), so bare
 * `YYYY-MM-DD` inputs are normalized like `getLedgerPostings`.
 */
export async function getLiveExecutiveDashboardData(
  from?: string,
  to?: string
): Promise<{
  pnl: ProfitAndLossSummary;
  recentTransactions: AccountPosting[];
  clearingBalance: number;
}> {
  const session = await auth();
  const token = session?.user?.apiToken;

  if (!token) {
    return { pnl: zeroSafePnl("", ""), recentTransactions: [], clearingBalance: 0 };
  }

  try {
    const toDateTime = (d?: string, endOfDay = false) =>
      !d ? undefined : d.includes("T") ? d : `${d}T${endOfDay ? "23:59:59" : "00:00:00"}`;

    const window = currentMonthWindow();
    const startDate = toDateTime(from || window.from, false) as string;
    const endDate = toDateTime(to || window.to, true) as string;

    const qs = new URLSearchParams({ startDate, endDate }).toString();
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
    const signal = timeoutSignal();

    const [pnlRes, txRes, balanceRes] = await Promise.all([
      fetch(buildApiUrl(`/finance/reports/profit-loss?${qs}`), {
        headers,
        cache: "no-store",
        signal,
      }),
      fetch(
        buildApiUrl("/finance/transactions?page=0&size=10&sort=occurredAt,desc"),
        { headers, cache: "no-store", signal }
      ),
      fetch(buildApiUrl("/finance/coa/balance"), { headers, cache: "no-store", signal }),
    ]);

    return {
      pnl: pnlRes.ok
        ? normalizeProfitLossReport(await pnlRes.json(), startDate, endDate)
        : zeroSafePnl(startDate, endDate),
      recentTransactions: txRes.ok ? unwrapPostings(await txRes.json()) : [],
      clearingBalance: balanceRes.ok
        ? unwrapClearingBalance(await balanceRes.json())
        : 0,
    };
  } catch (error) {
    console.error("[Finance] getLiveExecutiveDashboardData error:", error);
    return { pnl: zeroSafePnl("", ""), recentTransactions: [], clearingBalance: 0 };
  }
}

export type LedgerParams = {
  accountCode?: string;
  page?: number;
  size?: number;
  fromDate?: string;
  toDate?: string;
  companyScope?: string;
};

export async function getLedgerPostings(
  params: LedgerParams = {}
): Promise<SpringPage<AccountPosting>> {
  try {
    // Architect hardening #1: the backend binds `@DateTimeFormat(iso =
    // ISO.DATE_TIME) LocalDateTime`, so a bare `YYYY-MM-DD` from `<input
    // type="date">` yields HTTP 400. Normalize before building the query.
    const toDateTime = (d?: string, endOfDay = false) =>
      !d ? undefined : d.includes("T") ? d : `${d}T${endOfDay ? "23:59:59" : "00:00:00"}`;
    const from = toDateTime(params.fromDate, false);
    const to = toDateTime(params.toDate, true);

    const qs = new URLSearchParams();
    qs.append("page", (params.page ?? 0).toString());
    qs.append("size", (params.size ?? 20).toString());
    qs.append("sort", "occurredAt,desc");
    if (params.accountCode) qs.append("accountCode", params.accountCode);
    if (from) qs.append("fromDate", from);
    if (to) qs.append("toDate", to);
    if (params.companyScope) qs.append("companyScope", params.companyScope);

    const res = await fetch(buildApiUrl(`/finance/coa/postings?${qs.toString()}`), {
      headers: await getAuthHeaders(),
      cache: "no-store",
    });
    if (!res.ok) return EMPTY_PAGE(params.size ?? 20);

    const pageData = unwrapData<SpringPage<AccountPosting> | AccountPosting[]>(await res.json());

    const isPage =
      typeof pageData === "object" &&
      pageData !== null &&
      Array.isArray((pageData as SpringPage<AccountPosting>).content);
    if (isPage) return pageData as SpringPage<AccountPosting>;

    if (Array.isArray(pageData)) {
      return {
        ...EMPTY_PAGE(params.size ?? 20),
        content: pageData,
        totalElements: pageData.length,
      };
    }

    return EMPTY_PAGE(params.size ?? 20);
  } catch (error) {
    console.error("[Finance] getLedgerPostings error:", error);
    return EMPTY_PAGE(params.size ?? 20);
  }
}

export type ExpenseParams = {
  startDate?: string;
  endDate?: string;
  category?: ExpenseCategory;
  page?: number;
  size?: number;
};

export async function getExpenses(
  params: ExpenseParams = {}
): Promise<ApiResponse<SpringPage<Expense>>> {
  try {
    const today = new Date();
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const qs = new URLSearchParams();
    qs.append("page", (params.page ?? 0).toString());
    qs.append("size", (params.size ?? 20).toString());
    qs.append("startDate", params.startDate || firstOfMonth.toISOString().slice(0, 10));
    qs.append("endDate", params.endDate || today.toISOString().slice(0, 10));
    if (params.category) qs.append("category", params.category);

    const res = await apiFetch<SpringPage<Expense>>(`/expenses?${qs.toString()}`, {
      auth: "required",
      // Never cache user/company-scoped expense data in the shared Data Cache
      // (keyed by URL, not Authorization) — it would leak across tenants.
      cache: "no-store",
    });
    if (!res.success || !res.data) {
      return {
        status: res.status,
        success: false,
        message: res.message || "Failed to fetch expenses",
        data: EMPTY_PAGE(params.size ?? 20),
        timestamp: res.timestamp,
      };
    }
    return res as ApiResponse<SpringPage<Expense>>;
  } catch (error) {
    console.error("[Finance] getExpenses error:", error);
    return {
      status: 500,
      success: false,
      message: error instanceof Error ? error.message : String(error),
      data: EMPTY_PAGE(params.size ?? 20),
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Convert the backend `ExpenseSummary` payload — `{ startDate, endDate,
 * totalExpenses, expenseCount, expensesByCategory }` — into the frontend
 * `ExpenseSummary` shape (`totalAmount`, `totalCount`, `byCategory`).
 * Partial/missing fields tolerate to zeros/{} so the summary KPIs and
 * `ExpenseSummaryView` never crash on a real backend response.
 */
function normalizeExpenseSummaryResponse(json: unknown): ApiResponse<ExpenseSummary> {
  const error = (message: string, status = 500): ApiResponse<ExpenseSummary> => ({
    status,
    success: false,
    message,
    data: null,
    timestamp: new Date().toISOString(),
  });

  if (typeof json !== "object" || json === null) {
    return error("Failed to fetch expense summary");
  }
  const raw = json as Record<string, unknown>;

  const categoryMap = raw.expensesByCategory ?? raw.byCategory;
  return {
    status: 200,
    success: true,
    message: "Success",
    data: {
      totalAmount:
        typeof raw.totalAmount === "number"
          ? raw.totalAmount
          : typeof raw.totalExpenses === "number"
            ? raw.totalExpenses
            : 0,
      totalCount:
        typeof raw.totalCount === "number"
          ? raw.totalCount
          : typeof raw.expenseCount === "number"
            ? raw.expenseCount
            : 0,
      byCategory:
        typeof categoryMap === "object" &&
        categoryMap !== null &&
        !Array.isArray(categoryMap)
          ? (categoryMap as Record<ExpenseCategory, number>)
          : ({} as Record<ExpenseCategory, number>),
    },
    timestamp: new Date().toISOString(),
  };
}

export async function getExpenseSummary(
  startDate?: string,
  endDate?: string
): Promise<ApiResponse<ExpenseSummary>> {
  try {
    const today = new Date();
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const qs = new URLSearchParams();
    qs.append("startDate", startDate || firstOfMonth.toISOString().slice(0, 10));
    qs.append("endDate", endDate || today.toISOString().slice(0, 10));

    const res = await apiFetch<Record<string, unknown>>(`/expenses/summary?${qs.toString()}`, {
      auth: "required",
      cache: "no-store",
    });
    if (!res.success || !res.data) {
      return {
        status: res.status,
        success: false,
        message: res.message || "Failed to fetch expense summary",
        data: null,
        timestamp: res.timestamp,
      };
    }
    return normalizeExpenseSummaryResponse(res.data);
  } catch (error) {
    console.error("[Finance] getExpenseSummary error:", error);
    return {
      status: 500,
      success: false,
      message: error instanceof Error ? error.message : String(error),
      data: null,
      timestamp: new Date().toISOString(),
    };
  }
}

export async function getCustomerStatements(
  customerId: number,
  page: number = 0,
  size: number = 20
): Promise<ApiResponse<SpringPage<Statement>>> {
  try {
    const qs = new URLSearchParams();
    qs.append("page", page.toString());
    qs.append("size", size.toString());

    const res = await apiFetch<SpringPage<Statement>>(
      `/statements/customer/${customerId}?${qs.toString()}`,
      {
        auth: "required",
        tags: ["statements"],
        revalidate: 30,
      }
    );
    if (!res.success || !res.data) {
      return {
        status: res.status,
        success: false,
        message: res.message || "Failed to fetch statements",
        data: EMPTY_PAGE(size),
        timestamp: res.timestamp,
      };
    }
    return res as ApiResponse<SpringPage<Statement>>;
  } catch (error) {
    console.error("[Finance] getCustomerStatements error:", error);
    return {
      status: 500,
      success: false,
      message: error instanceof Error ? error.message : String(error),
      data: EMPTY_PAGE(size),
      timestamp: new Date().toISOString(),
    };
  }
}

export async function getProfitAndLossDashboard(
  startDate?: string,
  endDate?: string
): Promise<ApiResponse<ProfitAndLossSummary>> {
  try {
    const qs = new URLSearchParams();
    if (startDate) qs.append("startDate", startDate);
    if (endDate) qs.append("endDate", endDate);

    const res = await apiFetch<ProfitAndLossSummary>(
      `/analytics/profit-and-loss/dashboard${qs.toString() ? `?${qs.toString()}` : ""}`,
      {
        auth: "required",
        tags: ["finance"],
        revalidate: 60,
      }
    );
    return res.success && res.data
      ? res
      : {
          status: res.status,
          success: false,
          message: res.message || "Failed to fetch P&L dashboard",
          data: null,
          timestamp: res.timestamp,
        };
  } catch (error) {
    console.error("[Finance] getProfitAndLossDashboard error:", error);
    return {
      status: 500,
      success: false,
      message: error instanceof Error ? error.message : String(error),
      data: null,
      timestamp: new Date().toISOString(),
    };
  }
}

// ── New mutation actions ──────────────────────────────────────────────────────

export async function createExpense(
  request: ExpenseRequest
): Promise<ApiResponse<Expense>> {
  try {
    const res = await apiFetch<Expense>("/expenses", {
      method: "POST",
      body: request,
      auth: "required",
    });
    if (res.success) updateTag("expenses");
    return res;
  } catch (error) {
    console.error("[Finance] createExpense error:", error);
    return {
      status: 500,
      success: false,
      message: error instanceof Error ? error.message : String(error),
      data: null,
      timestamp: new Date().toISOString(),
    };
  }
}

export async function deleteExpense(id: string): Promise<ApiResponse<null>> {
  try {
    const res = await apiFetch<null>(`/expenses/${encodeURIComponent(id)}`, {
      method: "DELETE",
      auth: "required",
    });
    if (res.success) updateTag("expenses");
    return res;
  } catch (error) {
    console.error("[Finance] deleteExpense error:", error);
    return {
      status: 500,
      success: false,
      message: error instanceof Error ? error.message : String(error),
      data: null,
      timestamp: new Date().toISOString(),
    };
  }
}

export async function generateStatement(
  request: StatementRequest
): Promise<ApiResponse<Statement>> {
  try {
    const res = await apiFetch<Statement>("/statements/generate", {
      method: "POST",
      body: request,
      auth: "required",
    });
    if (res.success) updateTag("statements");
    return res;
  } catch (error) {
    console.error("[Finance] generateStatement error:", error);
    return {
      status: 500,
      success: false,
      message: error instanceof Error ? error.message : String(error),
      data: null,
      timestamp: new Date().toISOString(),
    };
  }
}

export async function downloadStatementPdf(
  id: number
): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(buildApiUrl(`/statements/${id}/download`), {
      headers: await getAuthHeaders(),
    });
    if (
      !res.ok ||
      !res.headers.get("content-type")?.includes("application/pdf")
    ) {
      console.error("[Finance] Statement PDF download failed", res.status, res.statusText);
      return null;
    }
    return res.arrayBuffer();
  } catch (error) {
    console.error("[Finance] downloadStatementPdf error:", error);
    return null;
  }
}

/**
 * Resolve a single statement by id — GATED.
 *
 * `GET /statements/{id}` is absent from the live spec (only `generate`,
 * `customer/{customerId}` and `{id}/download` exist). Return a readable 503
 * envelope instead of a direct lookup into a route that does not exist.
 */
export async function getStatementById(
  statementId: number,
  customerId?: number
): Promise<ApiResponse<Statement | null>> {
  void statementId;
  void customerId;
  return {
    status: 503,
    success: false,
    message:
      "Single-statement view is pending the backend route (GET /statements/{id} is absent from the live spec).",
    data: null,
    timestamp: new Date().toISOString(),
  };
}